// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract EvaluationEngine {
    enum Tier {
        LOW,
        MED,
        HIGH,
        BLOCK
    }

    event VerdictReached(address indexed agentId, Tier tier, string reason);

    function submitEvaluation(
        address agentId,
        bytes32 actionRequestHash,
        bytes[] calldata validatorSignatures,
        Tier tier,
        string calldata reason
    ) external {
        require(agentId != address(0), 'invalid agent');
        require(actionRequestHash != bytes32(0), 'invalid request');
        require(validatorSignatures.length >= 2, 'need 2-of-3');

        emit VerdictReached(agentId, tier, reason);
    }
}
