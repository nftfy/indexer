import { Contract, Signer, providers } from "ethers";

import { Addresses, Exchange } from ".";
import { OrderType, SwapOrderParams } from "./types";

import RouterAbi from "./abis/Router.json";
import FactoryAbi from "./abis/Factory.json";
import { Common } from "..";
import { Erc721 } from "../common/helpers";

export function isValidOrderType(orderType: string): orderType is keyof typeof OrderType {
  return orderType in OrderType;
}

export async function isValidSwap(chainId: number, signer: Signer, order: SwapOrderParams) {
  try {
    const exchange = new Exchange(chainId);
    await exchange.estimateSwapNfts(
      signer,
      order.orderType,
      order.path,
      order.tokenIds,
      order.amount,
      order.recipient,
      order.deadline
    );
    return true;
  } catch (error) {
    return false;
  }
}

export async function getPoolAddress(chainId: number, path: string[]) {
  const factoryContract = new Contract(Addresses.Factory[chainId], FactoryAbi);
  const pairAddress = await factoryContract.getPair(path[0], path[1]);
  return pairAddress;
}

export async function getWrappedAddress(chainId: number, collection: string) {
  const factoryContract = new Contract(Addresses.Factory[chainId], FactoryAbi);
  const wrapperAddress = await factoryContract.getWrapper(collection);
  return wrapperAddress;
}

export async function getWrappedBalance(
  provider: providers.BaseProvider,
  collection: string,
  wrapped: string
) {
  const erc721Contract = new Erc721(provider, collection);
  const wrapperBalance = erc721Contract.getBalance(wrapped);
  return wrapperBalance;
}

export async function getAmountsIn(chainId: number, tokenIds: string[], path: string[]) {
  const routerContract = new Contract(Addresses.Router[chainId], RouterAbi);
  const { amounts } = await routerContract.getAmountsInCollection(tokenIds, path);
  return {
    amountIn: amounts[0],
    amountOut: amounts[1],
  };
}

export async function getAmountsOut(chainId: number, tokenIds: string[], path: string[]) {
  const routerContract = new Contract(Addresses.Router[chainId], RouterAbi);
  const { amounts } = await routerContract.getAmountsOutCollection(tokenIds, path);
  return {
    amountIn: amounts[0],
    amountOut: amounts[1],
  };
}

/**
 * Retrieves the price of an NFT based on OrderType, collection and currency.
 * @param orderType swap OrderType.
 * @param chainId chain ID associated with the order.
 * @param collection collection address.
 * @param currency currency address (optional).
 * @returns price of one NFT in WETH or currency (wei).
 */
export async function getNftPrice(
  orderType: OrderType,
  chainId: number,
  collection: string,
  currency?: string
) {
  const weth = Common.Addresses.Weth[chainId];

  let price;

  // Buy orders
  if (orderType === OrderType.ETH_TO_ERC721) {
    const path = [weth, collection];
    const { amountIn } = await getAmountsOut(chainId, ["1"], path);
    price = amountIn.toString();
  }

  if (orderType === OrderType.ERC20_TO_ERC721 && currency) {
    const path = [currency, collection];
    const { amountIn } = await getAmountsOut(chainId, ["1"], path);
    price = amountIn.toString();
  }

  // Sell orders
  if (orderType === OrderType.ERC721_TO_ETH) {
    const path = [collection, weth];
    const { amountOut } = await getAmountsIn(chainId, ["1"], path);
    price = amountOut.toString();
  }

  if (orderType === OrderType.ERC721_TO_ERC20 && currency) {
    const path = [collection, currency];
    const { amountOut } = await getAmountsIn(chainId, ["1"], path);
    price = amountOut.toString();
  }

  return price;
}
