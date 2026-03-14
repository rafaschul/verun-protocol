// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract FeeVault {
    IERC20 public usdc;
    address public treasury;
    uint256 public feeAmount = 1000; // 0.001 USDC (6 decimals)

    // 70/10/10/10 base split, with kickback rules by score:
    // score < 500:  0% kickback
    // score 500-799: 5% kickback
    // score >= 800: 10% kickback

    event FeeReceived(address indexed agentId, uint256 amount, uint256 timestamp);
    event FeeDistributed(
        address indexed agentId,
        address indexed validatorAddress,
        uint256 validatorAmount,
        uint256 kickbackAmount,
        uint256 reserveAmount,
        uint256 timestamp
    );
    event KickbackPaid(address indexed agentId, uint256 amount, uint256 score, uint256 timestamp);

    constructor(address usdcAddress, address treasuryAddress) {
        usdc = IERC20(usdcAddress);
        treasury = treasuryAddress;
    }

    function chargeAndDistribute(
        address agentId,
        address validatorRevenueWallet,
        address reserveWallet,
        uint256 agentScore
    ) external {
        require(usdc.transferFrom(agentId, address(this), feeAmount), 'Fee transfer failed');

        uint256 validatorAmount = (feeAmount * 10) / 100;
        uint256 reserveAmount = (feeAmount * 10) / 100;

        uint256 kickbackBps = 0;
        if (agentScore >= 800) kickbackBps = 1000; // 10%
        else if (agentScore >= 500) kickbackBps = 500; // 5%

        uint256 kickbackAmount = (feeAmount * kickbackBps) / 10000;
        uint256 treasuryAmount = feeAmount - validatorAmount - reserveAmount - kickbackAmount;

        require(usdc.transfer(treasury, treasuryAmount), 'Treasury transfer failed');
        require(usdc.transfer(validatorRevenueWallet, validatorAmount), 'Validator transfer failed');
        require(usdc.transfer(reserveWallet, reserveAmount), 'Reserve transfer failed');

        if (kickbackAmount > 0) {
            require(usdc.transfer(agentId, kickbackAmount), 'Kickback transfer failed');
            emit KickbackPaid(agentId, kickbackAmount, agentScore, block.timestamp);
        }

        emit FeeReceived(agentId, feeAmount, block.timestamp);
        emit FeeDistributed(agentId, validatorRevenueWallet, validatorAmount, kickbackAmount, reserveAmount, block.timestamp);
    }
}
