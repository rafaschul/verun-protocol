// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AgentRegistry {
    struct Agent {
        address wallet;
        uint256 stake;
        uint256 score;
        uint256 registeredAt;
        bool active;
    }

    mapping(address => Agent) public agents;

    event AgentRegistered(address indexed wallet, uint256 stake, uint256 registeredAt);
    event AgentScoreUpdated(address indexed wallet, uint256 score);

    function registerAgent(address wallet, uint256 stake) external {
        require(wallet != address(0), 'invalid wallet');
        require(!agents[wallet].active, 'already registered');

        agents[wallet] = Agent({
            wallet: wallet,
            stake: stake,
            score: 0,
            registeredAt: block.timestamp,
            active: true
        });

        emit AgentRegistered(wallet, stake, block.timestamp);
    }

    function updateScore(address wallet, uint256 score) external {
        require(agents[wallet].active, 'not registered');
        agents[wallet].score = score;
        emit AgentScoreUpdated(wallet, score);
    }

    function getAgent(address wallet) external view returns (Agent memory) {
        return agents[wallet];
    }
}
