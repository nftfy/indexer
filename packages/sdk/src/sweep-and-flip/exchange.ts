import { Signer } from "@ethersproject/abstract-signer";
import { Contract, ContractTransaction } from "@ethersproject/contracts";

import * as Addresses from "./addresses";
import { TxData } from "../utils";

import RouterAbi from "./abis/Router.json";
import { OrderType } from "./types";

/**
 * Represents an Exchange contract for swapping NFTs.
 */
export class Exchange {
  public chainId: number;
  public contract: Contract;

  /**
   * Creates a new Exchange instance.
   * @param chainId The chain ID of the exchange.
   */
  constructor(chainId: number) {
    this.chainId = chainId;
    this.contract = new Contract(Addresses.Router[this.chainId], RouterAbi);
  }

  /**
   * Send transaction to Swaps NFTs
   * @param signer The Ethers Signer object used for execute transaction.
   * @param orderType OrderType of swap
   * @param path The path for the swap [input, output].
   * @param tokenIds The token IDs of Nfts involved in the swap.
   * @param amount The amount of currency for the swap.
   * @param recipient The address of recipient wallet of the swap.
   * @param deadline The deadline for the swap in seconds.
   * @returns ContractTransaction object
   */
  public async swapNFTs(
    signer: Signer,
    orderType: OrderType,
    path: string[],
    tokenIds: string[],
    amount: string,
    recipient: string,
    deadline: number
  ): Promise<ContractTransaction> {
    switch (orderType) {
      case OrderType.ETH_TO_ERC721: {
        const tx = this.swapETHForExactTokensCollection(
          await signer.getAddress(),
          tokenIds,
          amount,
          path,
          recipient,
          deadline
        );
        return signer.sendTransaction(tx);
      }

      case OrderType.ERC20_TO_ERC721: {
        const tx = this.swapTokensForExactTokensCollection(
          await signer.getAddress(),
          tokenIds,
          amount,
          path,
          recipient,
          deadline
        );
        return signer.sendTransaction(tx);
      }

      case OrderType.ERC721_TO_ETH: {
        const tx = this.swapExactTokensForETHCollection(
          await signer.getAddress(),
          tokenIds,
          amount,
          path,
          recipient,
          deadline
        );
        return signer.sendTransaction(tx);
      }

      case OrderType.ERC721_TO_ERC20: {
        const tx = this.swapExactTokensForTokensCollection(
          await signer.getAddress(),
          tokenIds,
          amount,
          path,
          recipient,
          deadline
        );
        return signer.sendTransaction(tx);
      }
    }
  }

  /**
   * Estimates the result of NFT swap.
   * @param signer The Ethers Signer object used for execute transaction.
   * @param orderType OrderType of swap
   * @param path The path for the swap [input, output].
   * @param tokenIds The token IDs of Nfts involved in the swap.
   * @param amount The amount of currency for the swap.
   * @param recipient The address of recipient wallet of the swap.
   * @param deadline The deadline for the swap in seconds.
   * @returns A promise that resolves to the estimated result and return a string.
   */
  public async estimateSwapNfts(
    signer: Signer,
    orderType: OrderType,
    path: string[],
    tokenIds: string[],
    amount: string,
    recipient: string,
    deadline: number
  ): Promise<string> {
    switch (orderType) {
      case OrderType.ETH_TO_ERC721: {
        const tx = this.swapETHForExactTokensCollection(
          await signer.getAddress(),
          tokenIds,
          amount,
          path,
          recipient,
          deadline
        );
        return signer.call(tx);
      }

      case OrderType.ERC20_TO_ERC721: {
        const tx = this.swapTokensForExactTokensCollection(
          await signer.getAddress(),
          tokenIds,
          amount,
          path,
          recipient,
          deadline
        );
        return signer.call(tx);
      }

      case OrderType.ERC721_TO_ETH: {
        const tx = this.swapExactTokensForETHCollection(
          await signer.getAddress(),
          tokenIds,
          amount,
          path,
          recipient,
          deadline
        );
        return signer.call(tx);
      }

      case OrderType.ERC721_TO_ERC20: {
        const tx = this.swapExactTokensForTokensCollection(
          await signer.getAddress(),
          tokenIds,
          amount,
          path,
          recipient,
          deadline
        );
        return signer.call(tx);
      }
    }
  }

  // --- Swap NFTs Tx Data ---

  public swapETHForExactTokensCollection(
    signer: string,
    tokenIds: string[],
    amount: string,
    path: string[],
    recipient: string,
    deadline: number
  ): TxData {
    return {
      from: signer,
      to: this.contract.address,
      data: this.contract.interface.encodeFunctionData("swapETHForExactTokensCollection", [
        tokenIds,
        path,
        recipient,
        deadline,
      ]),
      value: amount,
    };
  }

  public swapTokensForExactTokensCollection(
    signer: string,
    tokenIds: string[],
    amount: string,
    path: string[],
    recipient: string,
    deadline: number
  ): TxData {
    return {
      from: signer,
      to: this.contract.address,
      data: this.contract.interface.encodeFunctionData("swapTokensForExactTokensCollection", [
        tokenIds,
        amount,
        path,
        recipient,
        deadline,
      ]),
    };
  }

  public swapExactTokensForETHCollection(
    signer: string,
    tokenIds: string[],
    amount: string,
    path: string[],
    recipient: string,
    deadline: number
  ): TxData {
    return {
      from: signer,
      to: this.contract.address,
      data: this.contract.interface.encodeFunctionData("swapExactTokensForETHCollection", [
        tokenIds,
        amount,
        path,
        recipient,
        deadline,
      ]),
    };
  }

  public swapExactTokensForTokensCollection(
    signer: string,
    tokenIds: string[],
    amount: string,
    path: string[],
    recipient: string,
    deadline: number
  ): TxData {
    return {
      from: signer,
      to: this.contract.address,
      data: this.contract.interface.encodeFunctionData("swapExactTokensForTokensCollection", [
        tokenIds,
        amount,
        path,
        recipient,
        deadline,
      ]),
    };
  }
}
