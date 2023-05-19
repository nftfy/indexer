import { Interface } from "@ethersproject/abi";

import { EventData } from "@/events-sync/data";

/**
 * This event is emitted by Sweep and Flip Factory contract when a new Pair(token0, token1) is created.
 */
export const pairCreated: EventData = {
  kind: "sweep-and-flip",
  subKind: "sweep-and-flip-pair-created",
  topic: "0x63b13f6307f284441e029836b0c22eb91eb62a7ad555670061157930ce884f4e", // update
  numTopics: 3,
  abi: new Interface([
    `event PairCreated(address indexed token0, address indexed token1, address pair, uint)`,
  ]),
};

/**
 * This event is emitted by Sweep and Flip Factory contract when a NFT Wrapper (ERC20) is created.
 */
export const wrapperCreated: EventData = {
  kind: "sweep-and-flip",
  subKind: "sweep-and-flip-wrapper-created",
  topic: "0x63b13f6307f284441e029836b0c22eb91eb62a7ad555670061157930ce884f4e", // update
  numTopics: 2,
  abi: new Interface([`event WrapperCreated(address indexed collection, address wrapper, uint)`]),
};

/**
 * This event is emitted by Sweep and Flip NFT Wrapper contract when a NFT is wrapped (deposied).
 */
export const mint: EventData = {
  kind: "sweep-and-flip",
  subKind: "sweep-and-flip-mint",
  topic: "0x63b13f6307f284441e029836b0c22eb91eb62a7ad555670061157930ce884f4e", // update
  numTopics: 3, // update
  abi: new Interface([`event Mint(address indexed from, address indexed to, uint[] tokenIds)`]),
};

/**
 * This event is emitted by Sweep and Flip NFT Wrapper contract when a NFT is burned (redeemed).
 */
export const burn: EventData = {
  kind: "sweep-and-flip",
  subKind: "sweep-and-flip-burn",
  topic: "0x63b13f6307f284441e029836b0c22eb91eb62a7ad555670061157930ce884f4e", // update
  numTopics: 3, // update
  abi: new Interface([`event Burn(address indexed from, address indexed to, uint[] tokenIds)`]),
};

/**
 * This event is emitted by Sweep and Flip LP contract when a swap is executed.
 */
export const swap: EventData = {
  kind: "sweep-and-flip",
  subKind: "sweep-and-flip-swap",
  topic: "0x63b13f6307f284441e029836b0c22eb91eb62a7ad555670061157930ce884f4e", // update
  numTopics: 3,
  abi: new Interface([
    `event Swap(
      address indexed sender,
      uint amount0In,
      uint amount1In,
      uint amount0Out,
      uint amount1Out,
      address indexed to
    )`,
  ]),
};

/**
 * This event is emitted by Sweep and Flip LP contract when reserves (token0, token1) are updated.
 */
export const sync: EventData = {
  kind: "sweep-and-flip",
  subKind: "sweep-and-flip-sync",
  topic: "0x1f72ad2a14447fa756b6f5aca53504645af79813493aca2d906b69e4aaeb9492", // update
  numTopics: 1,
  abi: new Interface([`event Sync(uint112 reserve0, uint112 reserve1)`]),
};
