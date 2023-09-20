// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

interface ISweepAndFlipRouter {
  function factory() external view returns (address);
  function WETH() external view returns (address);
  function marketplaceAdmin() external view returns (address _marketplaceAdmin);
  function marketplaceWallet() external view returns (address _marketplaceWallet);
  function marketplaceFee() external view returns (uint _marketplaceFee);
  function royaltyFeeCap(address collection) external view returns (uint _royaltyFeeCap);

  function swapExactTokensForTokensCollection(
    uint[] memory tokenIdsIn,
    uint amountOutMin,
    address[] calldata path,
    bool capRoyaltyFee,
    address to,
    uint deadline
  ) external returns (uint[] memory amounts);
  function swapTokensForExactTokensCollection(
    uint[] memory tokenIdsOut,
    uint amountInMax,
    address[] memory path,
    bool capRoyaltyFee,
    address to,
    uint deadline
  ) external returns (uint[] memory amounts);
  function swapExactTokensForETHCollection(uint[] memory tokenIdsIn, uint amountOutMin, address[] calldata path, bool capRoyaltyFee, address to, uint deadline)
  external
  returns (uint[] memory amounts);
  function swapETHForExactTokensCollection(uint[] memory tokenIdsOut, address[] memory path, bool capRoyaltyFee, address to, uint deadline)
  external
  payable
  returns (uint[] memory amounts);

  function getAmountsOutCollection(uint[] memory tokenIdsIn, address[] memory path, bool capRoyaltyFee) external view returns (uint[] memory amounts);
  function getAmountsInCollection(uint[] memory tokenIdsOut, address[] memory path, bool capRoyaltyFee) external view returns (uint[] memory amounts);
}
