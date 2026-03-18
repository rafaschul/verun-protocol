import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org');

const agentRegistryABI = [
  'function getAgent(address wallet) view returns ((address wallet, uint256 stake, uint256 score, uint256 registeredAt, bool active, bool kickbackEligible, uint8 kickbackTier, uint256 totalKickbackEarned, bool sponsorVerified))'
];

const agentRegistry = new ethers.Contract(
  process.env.AGENT_REGISTRY_ADDRESS || '0x4362794FA4768A3986772275eA0ea113510Cc716',
  agentRegistryABI,
  provider
);

export const SCORE_REQUIREMENTS = {
  READ: 300,
  STANDARD: 500,
  ORDER: 600
};

function toScore(val) {
  return Number(val ?? 0);
}

function isAddress(addr) {
  try {
    return ethers.isAddress(addr);
  } catch {
    return false;
  }
}

export function makeVerunKYAGate(requiredScore = SCORE_REQUIREMENTS.STANDARD) {
  return async function verunKYAGate(req, res, next) {
    const agentIdRaw = req.headers['x-agent-id'] || req.query.agent;
    const agentId = typeof agentIdRaw === 'string' ? agentIdRaw.trim() : '';

    if (!agentId || !isAddress(agentId)) {
      return res.status(401).json({
        error: 'Agent identity required',
        detail: 'Pass X-Agent-ID header with your wallet address',
        docs: 'verun.network/docs',
        regulation: 'MiCAR Art. 82 — Agent authorization required'
      });
    }

    try {
      const agent = await agentRegistry.getAgent(agentId);
      const score = toScore(agent.score);

      if (!agent.active) {
        return res.status(403).json({
          error: 'Agent not registered on Verun',
          agentId,
          required_score: requiredScore,
          current_score: 0,
          action: 'Register your agent at verun.network',
          regulation: 'KYA compliance required for TokenSuite access'
        });
      }

      if (score < requiredScore) {
        return res.status(403).json({
          error: 'Verun KYA score insufficient for this operation',
          platform: 'TokenForge TokenSuite',
          operation: req.path,
          required_score: requiredScore,
          current_score: score,
          gap: requiredScore - score,
          kickback_eligible: false,
          action: `Improve Verun score by ${requiredScore - score} points`,
          verun: 'verun.network'
        });
      }

      req.verun = {
        agentId,
        score,
        kickbackEligible: Boolean(agent.kickbackEligible),
        kickbackTier: Number(agent.kickbackTier),
        sponsorVerified: Boolean(agent.sponsorVerified)
      };

      console.log(`[Verun KYA] PASS | Agent: ${agentId} | Score: ${score} | Path: ${req.path}`);
      next();
    } catch (err) {
      console.error('[Verun KYA] Check failed:', err?.message || err);
      return res.status(500).json({
        error: 'Verun KYA check failed',
        detail: err?.message || 'unknown error'
      });
    }
  };
}

export const verunKYAGateRead = makeVerunKYAGate(SCORE_REQUIREMENTS.READ);
export const verunKYAGateStandard = makeVerunKYAGate(SCORE_REQUIREMENTS.STANDARD);
export const verunKYAGateOrder = makeVerunKYAGate(SCORE_REQUIREMENTS.ORDER);
