// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AuditLog {
    enum Tier {
        LOW,
        MED,
        HIGH,
        BLOCK
    }

    struct Verdict {
        address agentId;
        Tier tier;
        uint256 timestamp;
        string reason;
    }

    mapping(address => Verdict[]) private history;

    event VerdictLogged(address indexed agentId, Tier tier, uint256 timestamp, string reason);
    event ValidatorSlashed(address indexed validator, uint256 amount, string reason);

    function logVerdict(address agentId, Tier tier, string calldata reason) external {
        Verdict memory v = Verdict({
            agentId: agentId,
            tier: tier,
            timestamp: block.timestamp,
            reason: reason
        });
        history[agentId].push(v);
        emit VerdictLogged(agentId, tier, block.timestamp, reason);
    }

    function getHistory(address agentId) external view returns (Verdict[] memory) {
        return history[agentId];
    }

    function emitSlashed(address validator, uint256 amount, string calldata reason) external {
        emit ValidatorSlashed(validator, amount, reason);
    }
}
