// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract FeeVault {
    IERC20 public immutable usdc;
    uint256 public immutable feeAmount;
    address public immutable treasury;

    event FeeReceived(address indexed agentId, uint256 amount, uint256 timestamp);

    constructor(address usdcAddress, address treasuryAddress, uint256 _feeAmount) {
        usdc = IERC20(usdcAddress);
        treasury = treasuryAddress;
        feeAmount = _feeAmount;
    }

    function chargeFee(address agentId) external {
        require(usdc.transferFrom(agentId, treasury, feeAmount), 'fee transfer failed');
        emit FeeReceived(agentId, feeAmount, block.timestamp);
    }
}
