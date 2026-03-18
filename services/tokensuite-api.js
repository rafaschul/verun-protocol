import express from 'express';
import crypto from 'node:crypto';
import {
  verunKYAGateRead as requireRead,
  verunKYAGateStandard as requireStandard,
  verunKYAGateOrder as requireOrder,
} from './tokensuite-verun-middleware.js';

const app = express();
app.use(express.json());

function fakeTxHash(seed = '') {
  return `0x${crypto.createHash('sha256').update(String(seed) + Date.now().toString()).digest('hex')}`;
}

// ─── HEALTH ───────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    platform: 'TokenForge TokenSuite',
    verun_kya: 'active',
    apis: ['Chain', 'Core Backend', 'MediaService'],
    compliance: ['MiCAR', 'eWpG', 'MiFID II']
  });
});

// ─── CHAIN API — READ (Score >= 300) ──────────────────────
app.get('/api/chain/wallets/:id/balance', requireRead, (req, res) => {
  const { score, agentId } = req.verun;
  res.json({
    wallet_id: req.params.id,
    agent: agentId,
    verun_score: score,
    access: 'GRANTED',
    balances: [
      { token: 'BCP-SECURITY-TOKEN-001', amount: '1000', symbol: 'BCP1' },
      { token: 'USDC', amount: '50000', symbol: 'USDC' }
    ],
    chain: 'Ethereum (eWpG compliant)',
    timestamp: new Date().toISOString()
  });
});

// ─── CHAIN API — MINT (Score >= 500) ──────────────────────
app.post('/api/chain/tokens/mint', requireStandard, async (req, res) => {
  const { score, kickbackTier, agentId } = req.verun;
  const { token_address, recipient, amount } = req.body || {};

  const txHash = fakeTxHash(`mint:${agentId}:${amount || '100'}`);

  res.json({
    platform: 'TokenForge TokenSuite',
    operation: 'mint',
    agent: agentId,
    verun_score: score,
    kickback_tier: `${kickbackTier}%`,
    access: 'GRANTED',
    transaction: {
      status: 'submitted',
      token_address: token_address || '0xBCP-SECURITY-TOKEN-001',
      recipient: recipient || agentId,
      amount: amount || '100',
      token_standard: 'ERC-1400',
      compliance: 'eWpG',
      tx_hash: txHash,
      basescan: `https://sepolia.basescan.org/tx/${txHash}`
    },
    verun_fee: {
      total: '0.001 USDC',
      treasury: score >= 800 ? '0.0007 USDC' : score >= 500 ? '0.00075 USDC' : '0.0008 USDC',
      tokensuite_validator: '0.0001 USDC',
      agent_kickback: score >= 800 ? '0.0001 USDC' : score >= 500 ? '0.00005 USDC' : '0',
      reserve: '0.0001 USDC'
    },
    audit: {
      on_chain: true,
      permanent: true,
      micar_compliant: true
    },
    timestamp: new Date().toISOString()
  });
});

// ─── CHAIN API — TRANSFER (Score >= 500) ──────────────────
app.post('/api/chain/tokens/transfer', requireStandard, (req, res) => {
  const { score, agentId } = req.verun;
  const { from, to, amount, token_address } = req.body || {};
  const txHash = fakeTxHash(`transfer:${agentId}:${amount || '50'}`);

  res.json({
    platform: 'TokenForge TokenSuite',
    operation: 'transfer',
    agent: agentId,
    verun_score: score,
    access: 'GRANTED',
    transaction: {
      status: 'submitted',
      from: from || agentId,
      to: to || '0xRECIPIENT',
      amount: amount || '50',
      token_address: token_address || '0xBCP-SECURITY-TOKEN-001',
      token_standard: 'ERC-1400',
      tx_hash: txHash,
      basescan: `https://sepolia.basescan.org/tx/${txHash}`
    },
    timestamp: new Date().toISOString()
  });
});

// ─── CORE BACKEND — ORDER (Score >= 600) ──────────────────
app.post('/api/core/orders/create', requireOrder, (req, res) => {
  const { score, agentId } = req.verun;
  const { product_id, quantity, investor_wallet } = req.body || {};

  res.json({
    platform: 'TokenForge TokenSuite',
    operation: 'create_order',
    agent: agentId,
    verun_score: score,
    access: 'GRANTED',
    order: {
      id: `ORD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      status: 'pending_kyc_confirmation',
      product_id: product_id || 'BCP-FUND-I',
      quantity: quantity || 1,
      investor_wallet: investor_wallet || agentId,
      compliance_check: 'passed',
      kyc_status: 'verified',
      kya_status: 'verun_verified',
      created_at: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

const PORT = Number(process.env.TOKENSUITE_API_PORT || 4000);
app.listen(PORT, () => {
  console.log(`TokenSuite Mock API: port ${PORT}`);
  console.log('Verun KYA Gate: ACTIVE');
  console.log('Score Requirements: READ=300 | STANDARD=500 | ORDER=600');
});

export default app;
