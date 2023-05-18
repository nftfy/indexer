import { TypedDataField } from "ethers";

/**
 * supported swap orders types.
 */
export enum OrderType {
  ETH_TO_ERC721,
  ERC20_TO_ERC721,
  ERC721_TO_ETH,
  ERC721_TO_ERC20,
}

/**
 * parameters for a swap order.
 */
export type SwapOrderParams = {
  /**
   * OrderType of the swap.
   */
  orderType: OrderType;
  /**
   * wallet address of the signer.
   */
  signerAddress: string;
  /**
   * path for the swap [input, output].
   */
  path: string[];
  /**
   * collection involved in swap.
   */
  collection: string;
  /**
   * token IDs of Nfts involved in the swap.
   */
  tokenIds: string[];
  /**
   * currency involved in swap.
   */
  currency: string;
  /**
   * amount of currency for the swap.
   */
  amount: string;
  /**
   * address of recipient wallet of the swap.
   */
  recipient: string;
  /**
   * deadline for the swap in seconds.
   */
  deadline: number;
};

export const swapOrderTypedData: Record<string, TypedDataField[]> = {
  SwapOrderParams: [
    {
      name: "orderType",
      type: "OrderType",
    },
    {
      name: "signerAddress",
      type: "string",
    },
    {
      name: "path",
      type: "string[]",
    },
    {
      name: "collection",
      type: "string",
    },
    {
      name: "tokenIds",
      type: "string[]",
    },
    {
      name: "currency",
      type: "string",
    },
    {
      name: "amount",
      type: "string",
    },
    {
      name: "recipient",
      type: "string",
    },
    {
      name: "deadline",
      type: "number",
    },
  ],
  OrderType: [
    {
      name: "ETH_TO_ERC721",
      type: "number",
    },
    {
      name: "ERC20_TO_ERC721",
      type: "number",
    },
    {
      name: "ERC721_TO_ETH",
      type: "number",
    },
    {
      name: "ERC721_TO_ERC20",
      type: "number",
    },
  ],
};
