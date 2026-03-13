require('dotenv').config();
const express = require('express');
const { Wallet, keccak256, toUtf8Bytes } = require('ethers');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const PRIVATE_KEY = process.env.VALIDATOR_PRIVATE_KEY;
if (!PRIVATE_KEY) throw new Error('VALIDATOR_PRIVATE_KEY missing');

const wallet = new Wallet(PRIVATE_KEY);

const sanctioned = require('../data/sanctioned_list.json').map((x) => x.toLowerCase());

function rateKey(agentId) {
  return `rate_${agentId}`;
}
const memoryRate = new Map();

function riskTier(input) {
  const now = Date.now();
  const key = rateKey(input.agent_id);
  const bucket = memoryRate.get(key) || [];
  const oneMinute = now - 60_000;
  const filtered = bucket.filter((ts) => ts > oneMinute);
  filtered.push(now);
  memoryRate.set(key, filtered);

  const destination = (input.destination || '').toLowerCase();
  const amount = Number(input.amount_usd || 0);
  const score = Number(input.agent_score || 0);

  if (sanctioned.includes(destination)) return ['BLOCK', 'sanctioned destination'];
  if (score === 0 && amount > 1000) return ['BLOCK', 'unknown agent high amount'];
  if (filtered.length > 10) return ['BLOCK', 'rate > 10/min'];
  if (amount > 10000 || score < 100) return ['HIGH', 'high amount or low score'];
  if (amount > 1000 || (input.registered_hours || 9999) < 24) return ['MED', 'medium risk'];
  return ['LOW', 'low risk'];
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, validator: wallet.address, port: PORT });
});

app.post('/evaluate', async (req, res) => {
  const payload = req.body;
  const [tier, reason] = riskTier(payload);
  const msg = JSON.stringify({
    agent_id: payload.agent_id,
    destination: payload.destination,
    amount_usd: payload.amount_usd,
    tier,
    reason,
    ts: Date.now(),
  });
  const digest = keccak256(toUtf8Bytes(msg));
  const signature = await wallet.signMessage(digest);

  res.json({ validator: wallet.address, tier, reason, digest, signature });
});

app.listen(PORT, () => {
  console.log(`validator service on ${PORT} ${wallet.address}`);
});
