// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./BaseExchangeModule.sol";
import "../../../interfaces/ISweepAndFlipRouter.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract SweepAndFlipModule is BaseExchangeModule {

  // --- Fields ---

  ISweepAndFlipRouter public immutable SWEEP_AND_FLIP_ROUTER;

  // --- Constructor ---

  constructor(address owner, address router, address sweepAndFlipRouter) BaseModule(owner) BaseExchangeModule(router){
    SWEEP_AND_FLIP_ROUTER = ISweepAndFlipRouter(sweepAndFlipRouter);
  }

  // --- Fallback ---

  receive() external payable {}

  // Swap Exact ERC20 amount For ERC721 Collection items
  function swapExactERC20ForCollection(
    uint[] memory tokenIdsIn,
    uint amountOutMin,
    address[] memory path,
    bool capRoyaltyFee,
    address to,
    uint deadline
  ) external payable nonReentrant refundETHLeftover(to) {
    // Execute swap
    SWEEP_AND_FLIP_ROUTER.swapExactTokensForTokensCollection{value: msg.value}(
      tokenIdsIn,
      amountOutMin,
      path,
      capRoyaltyFee,
      address(this),
      deadline
    );
  }

  // Swap ERC20 amount For Exact ERC721 Collection items
  function swapERC20ForExactCollection(
    uint[] memory tokenIdsOut,
    uint amountInMax,
    address[] memory path,
    bool capRoyaltyFee,
    address to,
    uint deadline
  ) external payable nonReentrant refundETHLeftover(to) {
    // Execute swap
    SWEEP_AND_FLIP_ROUTER.swapTokensForExactTokensCollection{value: msg.value}(
      tokenIdsOut,
      amountInMax,
      path,
      capRoyaltyFee,
      address(this),
      deadline
    );
  }

  // Swap Exact ETH amount For ERC721 Collection items
  function swapExactETHForCollection(
    uint[] memory tokenIdsIn,
    uint amountOutMin,
    address[] memory path,
    bool capRoyaltyFee,
    address to,
    uint deadline
  ) external payable nonReentrant refundETHLeftover(to) {
    // Execute swap
    SWEEP_AND_FLIP_ROUTER.swapExactTokensForETHCollection{value: msg.value}(
      tokenIdsIn,
      amountOutMin,
      path,
      capRoyaltyFee,
      address(this),
      deadline
    );
  }

  // Swap ETH amount For Exact ERC721 Collection items
  function swapETHForExactCollection(
    uint[] memory tokenIdsOut,
    address[] memory path,
    bool capRoyaltyFee,
    address to,
    uint deadline
  ) external payable nonReentrant refundETHLeftover(to) {
    // Execute swap
    SWEEP_AND_FLIP_ROUTER.swapETHForExactTokensCollection{value: msg.value}(
      tokenIdsOut,
      path,
      capRoyaltyFee,
      address(this),
      deadline
    );
  }
}
