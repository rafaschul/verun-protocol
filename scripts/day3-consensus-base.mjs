import express from 'express';
import { JsonRpcProvider, Wallet, Contract, keccak256, toUtf8Bytes } from 'ethers';

const RPC = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
if (!DEPLOYER_PRIVATE_KEY) throw new Error('DEPLOYER_PRIVATE_KEY missing');

const ADDR = {
  evaluationEngine: process.env.EVALUATION_ENGINE_ADDRESS || '0x8B3d26B9259AF379796777fc69fcCf84bd341cef',
  auditLog: process.env.AUDIT_LOG_ADDRESS || '0xe19f690B1423196121C9F3154bb463b9836619ba',
  feeVault: process.env.FEE_VAULT_ADDRESS || '0x4b7cc355a7c5B127aD0a6fcDAb9B39F225A6Fb85',
};

const provider = new JsonRpcProvider(RPC);
const deployer = new Wallet(DEPLOYER_PRIVATE_KEY, provider);

const evalAbi = [
  'function submitEvaluation(address agentId,bytes32 actionRequestHash,bytes[] validatorSignatures,uint8 tier,string reason) external',
  'event VerdictReached(address indexed agentId,uint8 tier,string reason)'
];
const auditAbi = [
  'function logVerdict(address agentId,uint8 tier,string reason) external',
  'function emitSlashed(address validator,uint256 amount,string reason) external',
  'event VerdictLogged(address indexed agentId,uint8 tier,uint256 timestamp,string reason)',
  'event ValidatorSlashed(address indexed validator,uint256 amount,string reason)'
];

const evaluation = new Contract(ADDR.evaluationEngine, evalAbi, deployer);
const audit = new Contract(ADDR.auditLog, auditAbi, deployer);

function makeValidatorService(port, pk) {
  const app = express();
  app.use(express.json());
  const wallet = new Wallet(pk);

  function tier(input) {
    const destination = (input.destination || '').toLowerCase();
    const amount = Number(input.amount_usd || 0);
    const score = Number(input.agent_score || 0);
    const sanctioned = new Set(['0xsanctioned', '0x000000000000000000000000000000000000dead']);
    if (sanctioned.has(destination)) return ['BLOCK', 'sanctioned destination'];
    if (score === 0 && amount > 1000) return ['BLOCK', 'unknown agent high amount'];
    if (amount > 10000 || score < 100) return ['HIGH', 'high amount or low score'];
    if (amount > 1000) return ['MED', 'medium risk'];
    return ['LOW', 'low risk'];
  }

  app.post('/evaluate', async (req, res) => {
    const payload = req.body;
    const [risk, reason] = tier(payload);
    const msg = JSON.stringify({
      agent_id: payload.agent_id,
      destination: payload.destination,
      amount_usd: payload.amount_usd,
      risk,
      reason,
      ts: Date.now(),
    });
    const digest = keccak256(toUtf8Bytes(msg));
    const signature = await wallet.signMessage(digest);
    res.json({ validator: wallet.address, tier: risk, reason, digest, signature });
  });

  const server = app.listen(port);
  return { server, wallet, port };
}

const mapTier = { LOW: 0, MED: 1, HIGH: 2, BLOCK: 3 };

async function main() {
  const v1 = makeValidatorService(3001, process.env.VALIDATOR_1_PRIVATE_KEY || Wallet.createRandom().privateKey);
  const v2 = makeValidatorService(3002, process.env.VALIDATOR_2_PRIVATE_KEY || Wallet.createRandom().privateKey);
  const v3 = makeValidatorService(3003, process.env.VALIDATOR_3_PRIVATE_KEY || Wallet.createRandom().privateKey);

  const payload = {
    agent_id: Wallet.createRandom().address,
    destination: '0x000000000000000000000000000000000000dEaD',
    amount_usd: 50000,
    agent_score: 0,
    action_type: 'transfer'
  };

  const responses = await Promise.all([
    fetch('http://127.0.0.1:3001/evaluate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json()),
    fetch('http://127.0.0.1:3002/evaluate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json()),
    fetch('http://127.0.0.1:3003/evaluate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json()),
  ]);

  const tally = responses.reduce((m, r) => ((m[r.tier] = (m[r.tier] || 0) + 1), m), {});
  const winner = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
  if ((tally[winner] || 0) < 2) throw new Error('No 2-of-3 consensus');

  const selected = responses.filter(r => r.tier === winner).slice(0, 2);
  const signatures = selected.map(r => r.signature);
  const actionHash = keccak256(toUtf8Bytes(JSON.stringify(payload)));
  const reason = `${winner} | consensus by ${responses.map(r => r.validator).join(',')}`;

  const txEval = await evaluation.submitEvaluation(payload.agent_id, actionHash, signatures, mapTier[winner], reason, { gasLimit: 500000 });
  const rcEval = await txEval.wait(1);

  let txAuditVerdict = null;
  let txSlash = null;
  if (winner === 'BLOCK') {
    txAuditVerdict = await audit.logVerdict(payload.agent_id, 3, 'BLOCK', { gasLimit: 300000 });
    await txAuditVerdict.wait(1);
    txSlash = await audit.emitSlashed(responses[0].validator, 1, 'BLOCK', { gasLimit: 300000 });
    await txSlash.wait(1);
  }

  for (const v of [v1, v2, v3]) v.server.close();

  console.log(JSON.stringify({
    network: 'base-sepolia',
    evaluationTx: txEval.hash,
    auditVerdictTx: txAuditVerdict?.hash || null,
    slashTx: txSlash?.hash || null,
    verdict: winner,
    validators: responses.map(r => r.validator),
    signaturesUsed: signatures.length,
    feeVaultCalled: false
  }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
