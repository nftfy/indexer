import { Signer } from "@ethersproject/abstract-signer";
import { Contract, ContractTransaction } from "@ethersproject/contracts";

import * as Addresses from "./addresses";
import { TxData } from "../utils";

import RouterAbi from "./abis/Router.json";
import { OrderType } from "./types";

export class Exchange {
  public chainId: number;
  public contract: Contract;

  constructor(chainId: number) {
    this.chainId = chainId;
    this.contract = new Contract(Addresses.Router[this.chainId], RouterAbi);
  }

  // --- Send Tx Swap NFTs ---

  public async swapNFTs(
    signer: Signer,
    orderType: OrderType,
    path: string[],
    tokenIds: string[],
    amount: string,
    recipient: string,
    deadline: number
  ): Promise<ContractTransaction> {

    switch(orderType) { 
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
   } 
  }

  // --- Estimate Swap NFTs ---

  public async estimateSwapNfts(
    signer: Signer,
    orderType: OrderType,
    path: string[],
    tokenIds: string[],
    amount: string,
    recipient: string,
    deadline: number
  ): Promise<string> {

    switch(orderType) { 
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
   } 
  }

  // --- Swap NFTs Methods Data ---

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
      data: this.contract.interface.encodeFunctionData(
        "swapExactTokensForETHCollection", 
        [tokenIds, amount, path, recipient, deadline]
      ),
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
      data: this.contract.interface.encodeFunctionData(
        "swapExactTokensForTokensCollection", 
        [tokenIds, amount, path, recipient, deadline]
      ),
    };
  }

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
      data: this.contract.interface.encodeFunctionData(
        "swapETHForExactTokensCollection", 
        [tokenIds, path, recipient, deadline]
      ),
      value: amount
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
      data: this.contract.interface.encodeFunctionData(
        "swapTokensForExactTokensCollection", 
        [tokenIds, amount, path, recipient, deadline]
      ),
    };
  }
}
