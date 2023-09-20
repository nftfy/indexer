import { AddressZero } from "@ethersproject/constants";
import * as Sdk from "@reservoir0x/sdk";
import { baseProvider } from "@/common/provider";
import pLimit from "p-limit";

import { idb, pgp } from "@/common/db";
import { logger } from "@/common/logger";
import { bn, now, toBuffer } from "@/common/utils";
import { config } from "@/config/index";
import {
  orderUpdatesByIdJob,
  OrderUpdatesByIdJobPayload,
} from "@/jobs/order-updates/order-updates-by-id-job";
import { Sources } from "@/models/sources";
import { DbOrder, OrderMetadata, generateSchemaHash } from "@/orderbook/orders/utils";
import { OrderType } from "@reservoir0x/sdk/src/sweep-and-flip/types";
import { generateMerkleTree } from "@reservoir0x/sdk/src/common/helpers";
import * as tokenSet from "@/orderbook/token-sets";
import { Contract } from "@ethersproject/contracts";
import { Interface } from "@ethersproject/abi";

export type OrderInfo = {
  orderParams: {
    // SDK parameters
    orderType: Sdk.SweepAndFlip.Types.OrderType;
    signerAddress: string;
    path: string[];
    collection: string;
    tokenIds: string[];
    currency: string;
    amount: string;
    recipient: string;
    deadline: number;
    // Validation parameters (for ensuring only the latest event is relevant)
    txHash: string;
    txTimestamp: number;
    txBlock: number;
    logIndex: number;
    batchIndex: number;
  };
  metadata: OrderMetadata;
};

type SaveResult = {
  id: string;
  status: string;
  unfillable?: boolean;
  txHash?: string;
  txTimestamp?: number;
  logIndex?: number;
  batchIndex?: number;
};

export const save = async (orderInfos: OrderInfo[]): Promise<SaveResult[]> => {
  const results: SaveResult[] = [];
  const orderValues: DbOrder[] = [];

  const handleOrder = async ({ orderParams, metadata }: OrderInfo) => {
    try {
      const order = new Sdk.SweepAndFlip.Order(config.chainId, orderParams);
      const id = order.hash();
      const orderSide =
        orderParams.orderType === OrderType.ETH_TO_ERC721 ||
        orderParams.orderType === OrderType.ERC20_TO_ERC721
          ? "buy"
          : "sell";

      // Check: order doesn't already exist
      const orderExists = await idb.oneOrNone(
        `
          WITH x AS (
            UPDATE orders
            SET
              raw_data = $/rawData/,
              updated_at = now()
            WHERE orders.id = $/id/
              AND raw_data IS NULL
          )
          SELECT 1 FROM orders WHERE orders.id = $/id/
        `,
        {
          id,
          rawData: order.params,
        }
      );

      // Check: order exists
      if (orderExists) {
        return results.push({
          id,
          status: "already-exists",
        });
      }

      // Check: order has a valid start time
      const currentTime = now();
      const deadline = order.params.deadline;
      if (deadline - 60 >= currentTime) {
        return results.push({
          id,
          status: "invalid-start-time",
        });
      }

      // Check: order has ETH as payment token
      if (orderParams.currency !== Sdk.Common.Addresses.Native[config.chainId]) {
        return results.push({
          id,
          status: "unsupported-payment-token",
        });
      }

      // Check: order is partially-fillable
      const quantityRemaining = orderParams.amount ?? "1";
      if ([0, 2].includes(order.params.orderType) && bn(quantityRemaining).gt(1)) {
        return results.push({
          id,
          status: "not-partially-fillable",
        });
      }

      // Check: order is valid using router
      if (
        order.params.orderType === OrderType.ERC721_TO_ERC20 ||
        order.params.orderType === OrderType.ERC20_TO_ERC721
      ) {
        return results.push({
          id,
          status: "unsupported-order-type",
        });
      }

      // Check: order fillability
      let fillabilityStatus = "fillable";
      let approvalStatus = "approved";
      try {
        await order.checkFillability(baseProvider);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        // Keep any orders that can potentially get valid in the future
        if (error.message === "no-balance-no-approval") {
          fillabilityStatus = "no-balance";
          approvalStatus = "no-approval";
        } else if (error.message === "no-approval") {
          approvalStatus = "no-approval";
        } else if (error.message === "no-balance") {
          fillabilityStatus = "no-balance";
        } else {
          return results.push({
            id,
            txHash: orderParams.txHash,
            status: "not-fillable",
          });
        }
      }

      // Check and save: associated token set
      let tokenSetId: string | undefined;
      const merkleRoot = generateMerkleTree(order.params.tokenIds);
      const schemaHash = metadata.schemaHash ?? generateSchemaHash(metadata.schema);

      if (merkleRoot) {
        [{ id: tokenSetId }] = await tokenSet.tokenList.save([
          {
            id: `list:${orderParams.collection}:${merkleRoot.getHexRoot()}`,
            schemaHash,
            schema: metadata.schema,
          },
        ]);
      }

      // Check: valid token set
      if (!tokenSetId) {
        return results.push({
          id,
          status: "invalid-token-set",
        });
      }

      // TODO Handle: price and value
      const tokenIds = order.params.tokenIds || Math.floor(Number(order.params.amount)).toString();
      let amounts = [];
      if (order.params.orderType === OrderType.ERC721_TO_ETH) {
        try {
          const routerContract = new Contract(
            Sdk.SweepAndFlip.Addresses.Router[config.chainId],
            new Interface([
              `
              function getAmountsInCollection(
                uint[] memory tokenIdsOut, address[] memory path, bool capRoyaltyFee
              ) external view returns (
                uint[] memory amounts
                )
            `,
            ])
          );

          amounts = await routerContract.getAmountsInCollection(tokenIds, order.params.path, false);
        } catch (error) {
          return results.push({
            id,
            status: "invalid-order",
          });
        }
      } else if (order.params.orderType === OrderType.ETH_TO_ERC721) {
        try {
          const routerContract = new Contract(
            Sdk.SweepAndFlip.Addresses.Router[config.chainId],
            new Interface([
              `
              function getAmountsOutCollection(
                uint[] memory tokenIdsIn, address[] memory path, bool capRoyaltyFee
              ) external view returns (
                uint[] memory amounts
                )
            `,
            ])
          );

          amounts = await routerContract.getAmountsOutCollection(
            tokenIds,
            order.params.path,
            false
          );
        } catch (error) {
          return results.push({
            id,
            status: "invalid-order",
          });
        }
      }

      // Handle: source
      const sources = await Sources.getInstance();
      let source = await sources.getOrInsert("sweep-and-flip");
      if (metadata.source) {
        source = await sources.getOrInsert(metadata.source);
      }

      const validFrom = `date_trunc('seconds', to_timestamp(${orderParams.txTimestamp}))`;
      const validTo = deadline
        ? `date_trunc('seconds', to_timestamp(${order.params.deadline}))`
        : "'infinity'";

      orderValues.push({
        id,
        kind: "sweep-and-flip",
        side: orderSide,
        fillability_status: fillabilityStatus,
        approval_status: approvalStatus,
        token_set_id: tokenSetId,
        token_set_schema_hash: toBuffer(schemaHash),
        maker: toBuffer(orderParams.signerAddress),
        taker: toBuffer(AddressZero),
        price: amounts[0].toString(),
        value: amounts[0].toString(),
        currency: toBuffer(orderParams.currency),
        currency_price: orderParams.amount.toString(),
        currency_value: orderParams.amount.toString(),
        needs_conversion: null,
        quantity_remaining: "1",
        valid_between: `tstzrange(${validFrom}, ${validTo}, '[]')`,
        nonce: null,
        source_id_int: source?.id,
        is_reservoir: null,
        contract: toBuffer(orderParams.collection),
        conduit: toBuffer(Sdk.SweepAndFlip.Addresses.Router[config.chainId]),
        fee_bps: 0,
        fee_breakdown: [],
        dynamic: null,
        raw_data: orderParams,
        expiration: validTo,
        missing_royalties: null,
        normalized_value: null,
        currency_normalized_value: null,
        block_number: orderParams.txBlock,
        log_index: orderParams.logIndex,
      });

      const unfillable =
        fillabilityStatus !== "fillable" || approvalStatus !== "approved" ? true : undefined;

      results.push({
        id,
        status: "success",
        unfillable,
        txHash: orderParams.txHash,
        txTimestamp: orderParams.txTimestamp,
        logIndex: orderParams.logIndex,
        batchIndex: orderParams.batchIndex,
      });
    } catch (error) {
      logger.error(
        "orders-sweep-and-flip-save",
        `Failed to handle order with params ${JSON.stringify(orderParams)}: ${error}`
      );
    }
  };

  // Process all orders concurrently
  const limit = pLimit(20);
  await Promise.all(orderInfos.map((orderInfo) => limit(() => handleOrder(orderInfo))));

  if (orderValues.length) {
    const columns = new pgp.helpers.ColumnSet(
      [
        "id",
        "kind",
        "side",
        "fillability_status",
        "approval_status",
        "token_set_id",
        "token_set_schema_hash",
        "maker",
        "taker",
        "price",
        "value",
        "currency",
        "currency_price",
        "currency_value",
        "needs_conversion",
        { name: "valid_between", mod: ":raw" },
        "nonce",
        "source_id_int",
        "is_reservoir",
        "contract",
        "conduit",
        "fee_bps",
        { name: "fee_breakdown", mod: ":json" },
        "dynamic",
        "raw_data",
        { name: "expiration", mod: ":raw" },
        "block_number",
        "log_index",
      ],
      {
        table: "orders",
      }
    );
    await idb.none(pgp.helpers.insert(orderValues, columns) + " ON CONFLICT DO NOTHING");
  }

  await orderUpdatesByIdJob.addToQueue(
    results
      .filter(({ status, unfillable }) => status === "success" && !unfillable)
      .map(
        ({ id, txHash, txTimestamp, logIndex, batchIndex }) =>
          ({
            context: `new-order-${id}`,
            id,
            trigger: {
              kind: "new-order",
              txHash,
              txTimestamp,
              logIndex,
              batchIndex,
            },
          } as OrderUpdatesByIdJobPayload)
      )
  );

  return results;
};
