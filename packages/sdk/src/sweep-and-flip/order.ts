import { Provider } from "@ethersproject/abstract-provider";
import { _TypedDataEncoder } from "@ethersproject/hash";
import { Signer } from "ethers";

import * as Addresses from "./addresses";
import * as Types from "./types";
import * as Common from "../common";
import { bn, getCurrentTimestamp, lc, n, s, uniqBy } from "../utils";
import { OrderType } from "./types";
import { isValidOrderType, isValidSwap } from "./helpers";

export class Order {
  public chainId: number;
  public params: Types.SwapOrderParams;

  constructor(chainId: number, params: Types.SwapOrderParams) {
    this.chainId = chainId;

    try {
      this.params = normalize(params)
    } catch {
      throw new Error("Invalid params");
    }

    if (!params.orderType) {
      throw new Error("Empty order type");
    }

    if (isValidOrderType(params.orderType.toString())) {
      throw new Error("Invalid order type");
    }

    if (!params.signerAddress) {
      throw new Error("Empty signer");
    }

    if (!params.tokenIds.length) {
      throw new Error("Empty selected items");
    }

    if (!params.path.length) {
      throw new Error("Empty path");
    }

    if (!params.amount) {
      throw new Error("Empty amount");
    }

    if (!params.recipient) {
      throw new Error("Empty recipient");
    }

    if (!params.deadline) {
      throw new Error("Empty deadline");
    }

    if(params.deadline < getCurrentTimestamp()) {
      throw new Error("Invalid deadline");
    }
  }

  public async checkValidity(signer: Signer) {
    const estimate = await isValidSwap(this.chainId, signer, this.params);
    if (!estimate) {
      throw new Error("Invalid order");
    }
  }

  public async checkFillability(provider: Provider) {
    const chainId = await provider.getNetwork().then((n) => n.chainId);

    if (this.params.orderType === OrderType.ERC721_TO_ETH || this.params.orderType === OrderType.ERC721_TO_ERC20) {
      const collection = this.params.path[0];
      const erc721 = new Common.Helpers.Erc721(provider, collection);

      this.params.tokenIds.forEach(async tokenId => {
        const owner = await erc721.getOwner(tokenId);
        if (lc(owner) !== lc(this.params.signerAddress)) {
          throw new Error("no-balance");
        }
      })

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

      const allowance = await erc20.getAllowance(this.params.signerAddress, Addresses.Router[chainId]);
      if (bn(allowance).lt(this.params.amount)) {
        throw new Error("no-approval");
      }
    } 
  }
}

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
