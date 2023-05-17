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
   * token IDs of Nfts involved in the swap.
   */
  tokenIds: string[];
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
