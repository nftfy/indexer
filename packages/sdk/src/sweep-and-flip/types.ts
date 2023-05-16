export enum OrderType {
  ERC721_TO_ETH,
  ERC721_TO_ERC20,
  ETH_TO_ERC721,
  ERC20_TO_ERC721,
};

export type SwapOrderParams = {
  orderType: OrderType;
  signerAddress: string;
  path: string[]; 
  tokenIds: string[];
  amount: string;
  recipient: string;
  deadline: number;
};
