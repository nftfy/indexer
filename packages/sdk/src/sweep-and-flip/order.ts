import { Provider } from "@ethersproject/abstract-provider";
import { Signer } from "ethers";

import * as Addresses from "./addresses";
import * as Types from "./types";
import * as Common from "../common";
import { bn, getCurrentTimestamp, lc, n, s, uniqBy } from "../utils";
import { OrderType } from "./types";
import { isValidOrderType, isValidSwap } from "./helpers";

/**
 * Represents an order for a Sweep and Flip swap.
 */
export class Order {
  public chainId: number;
  public params: Types.SwapOrderParams;

  /**
   * Creates a new Order instance.
   * @param chainId The chain ID of the order.
   * @param params The parameters of the swap order.
   * @throws Error if the params are invalid or missing required values.
   */
  constructor(chainId: number, params: Types.SwapOrderParams) {
    this.chainId = chainId;

    try {
      this.params = normalize(params);
    } catch {
      throw new Error("Invalid params");
    }

    if (isValidOrderType(params.orderType.toString())) {
      throw new Error("Invalid order type");
    }

    if (params.deadline < getCurrentTimestamp()) {
      throw new Error("Invalid deadline");
    }
  }

  /**
   * Checks the validity of the order.
   * @param signer The Ethers Signer object used for call.
   * @throws Error if the order is invalid or transaction will be reverted.
   */
  public async checkValidity(signer: Signer) {
    const estimate = await isValidSwap(this.chainId, signer, this.params);
    if (!estimate) {
      throw new Error("Invalid order");
    }
  }

  /**
   * Checks the fillability of the order.
   * @param provider The Ethers Provider object used for call.
   * @throws Error if the order cannot be filled.
   */
  public async checkFillability(provider: Provider) {
    const chainId = await provider.getNetwork().then((n) => n.chainId);

    if (
      this.params.orderType === OrderType.ERC721_TO_ETH ||
      this.params.orderType === OrderType.ERC721_TO_ERC20
    ) {
      const collection = this.params.path[0];
      const erc721 = new Common.Helpers.Erc721(provider, collection);

      this.params.tokenIds.forEach(async (tokenId) => {
        const owner = await erc721.getOwner(tokenId);
        if (lc(owner) !== lc(this.params.signerAddress)) {
          throw new Error("no-balance");
        }
      });

      const isApproved = await erc721.isApproved(
        this.params.signerAddress,
        Addresses.Router[this.chainId]
      );
      if (!isApproved) {
        throw new Error("no-approval");
      }
    }

    if (this.params.orderType === OrderType.ETH_TO_ERC721) {
      const balance = await provider.getBalance(this.params.signerAddress);
      if (bn(balance).lt(this.params.amount)) {
        throw new Error("no-balance");
      }
    }

    if (this.params.orderType === OrderType.ERC20_TO_ERC721) {
      const currency = this.params.path[0];
      const erc20 = new Common.Helpers.Erc20(provider, currency);

      const balance = await erc20.getBalance(this.params.signerAddress);
      if (bn(balance).lt(this.params.amount)) {
        throw new Error("no-balance");
      }

      const allowance = await erc20.getAllowance(
        this.params.signerAddress,
        Addresses.Router[chainId]
      );
      if (bn(allowance).lt(this.params.amount)) {
        throw new Error("no-approval");
      }
    }
  }
}

/**
 * Normalizes the swap order parameters by converting them to the expected format.
 * @param order The swap order parameters.
 * @returns The normalized swap order parameters.
 */
const normalize = (order: Types.SwapOrderParams): Types.SwapOrderParams => {
  return {
    orderType: order.orderType,
    signerAddress: lc(order.signerAddress),
    path: uniqBy(order.path, (address) => s(address)),
    tokenIds: uniqBy(order.tokenIds, (id) => s(id)),
    amount: s(order.amount),
    recipient: lc(order.recipient),
    deadline: n(order.deadline),
  };
};
