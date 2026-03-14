// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AgentRegistry {
    struct AgentRecord {
        address wallet;
        uint256 stake;
        uint256 score;
        uint256 registeredAt;
        bool active;
        bool kickbackEligible;
        uint8 kickbackTier; // 0, 5, 10
        uint256 totalKickbackEarned;
        bool sponsorVerified;
    }

    mapping(address => AgentRecord) public agents;
    address[] public agentList;

    event AgentRegistered(address indexed wallet, uint256 stake, uint256 timestamp);
    event ScoreUpdated(address indexed wallet, uint256 newScore, uint8 kickbackTier);
    event KickbackAccrued(address indexed wallet, uint256 amount, uint256 totalEarned);

    function registerAgent(uint256 stake) external {
        require(!agents[msg.sender].active, 'Already registered');

        agents[msg.sender] = AgentRecord({
            wallet: msg.sender,
            stake: stake,
            score: 0,
            registeredAt: block.timestamp,
            active: true,
            kickbackEligible: false,
            kickbackTier: 0,
            totalKickbackEarned: 0,
            sponsorVerified: false
        });

        agentList.push(msg.sender);
        emit AgentRegistered(msg.sender, stake, block.timestamp);
    }

    function updateScoreFromInputs(
        address wallet,
        uint256 walletAgeDays,
        uint256 txVolumeUsd,
        bool _sponsorVerified,
        bool cashlinkOrBcpVerified,
        uint256 monthlyFlags,
        bool sanctionedContact
    ) external {
        require(agents[wallet].active, 'Agent not registered');

        uint256 score = 0;

        // 1) Wallet age
        if (walletAgeDays > 90) score += 150;
        else if (walletAgeDays >= 30) score += 100;
        else if (walletAgeDays >= 7) score += 50;

        // 2) Tx volume
        if (txVolumeUsd > 1_000_000) score += 300;
        else if (txVolumeUsd > 100_000) score += 200;
        else if (txVolumeUsd > 10_000) score += 100;

        // 3) Human sponsor (Self protocol ZK flag)
        if (_sponsorVerified) score += 200;

        // 4) Cashlink/BCP verified
        if (cashlinkOrBcpVerified) score += 300;

        // 5) Clean behavior (monthly)
        if (monthlyFlags == 0) score += 20;
        else score = score >= 100 ? score - 100 : 0;

        // 6) Sanctioned contact
        if (sanctionedContact) score = score >= 500 ? score - 500 : 0;

        uint8 tier = 0;
        if (score >= 800) tier = 10;
        else if (score >= 500) tier = 5;

        agents[wallet].score = score;
        agents[wallet].sponsorVerified = _sponsorVerified;
        agents[wallet].kickbackTier = tier;
        agents[wallet].kickbackEligible = tier > 0;

        emit ScoreUpdated(wallet, score, tier);
    }

    function recordKickback(address wallet, uint256 amount) external {
        require(agents[wallet].active, 'Agent not registered');
        agents[wallet].totalKickbackEarned += amount;
        emit KickbackAccrued(wallet, amount, agents[wallet].totalKickbackEarned);
    }

    function getAgent(address wallet) external view returns (AgentRecord memory) {
        return agents[wallet];
    }

    function getTotalAgents() external view returns (uint256) {
        return agentList.length;
    }
}
