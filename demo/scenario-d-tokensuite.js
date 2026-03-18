const API = process.env.TOKENSUITE_API_URL || 'http://localhost:4000';

function printHeader(title) {
  console.log('\n════════════════════════════════════════════');
  console.log(`VERUN × TOKENSUITE — ${title}`);
  console.log('════════════════════════════════════════════');
}

function printResult(data) {
  console.log('\n────────────────────────────────────────────');
  console.log(`Verun Score: ${data.verun_score}`);
  console.log(`Kickback Tier: ${data.kickback_tier || '0%'}`);
  console.log(`Access: ${data.access} ✓`);
  if (data.transaction) {
    console.log(`Operation: ${data.operation}`);
    console.log(`Token Standard: ${data.transaction.token_standard}`);
    console.log(`Compliance: ${data.transaction.compliance || 'MiCAR + eWpG'}`);
    console.log(`Tx Hash: ${data.transaction.tx_hash}`);
    if (data.transaction.basescan) console.log(`BaseScan: ${data.transaction.basescan}`);
  }
  if (data.verun_fee) {
    console.log('\nFee Distribution:');
    console.log(` Treasury: ${data.verun_fee.treasury}`);
    console.log(` TokenSuite: ${data.verun_fee.tokensuite_validator}`);
    console.log(` Agent Kickback: ${data.verun_fee.agent_kickback}`);
    console.log(` Reserve: ${data.verun_fee.reserve}`);
  }
  if (data.order) {
    console.log(`Order ID: ${data.order.id}`);
    console.log(`Order Status: ${data.order.status}`);
    console.log(`KYC: ${data.order.kyc_status} | KYA: ${data.order.kya_status}`);
  }
  console.log('────────────────────────────────────────────');
}

async function call(method, path, body, agentId) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-agent-id': agentId,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const e = new Error(data?.error || `HTTP ${res.status}`);
    e.response = { data, status: res.status };
    throw e;
  }
  return data;
}

async function scenarioDGoodAgent() {
  printHeader('SCENARIO D1 — Authorized Agent');
  const GOOD_AGENT = process.env.GOOD_AGENT_ADDRESS || '0x4C8585A50919e05C7881B9428626404F09798Ba6';

  console.log(`\nAgent: ${GOOD_AGENT}`);
  console.log('Operation: POST /api/chain/tokens/mint');
  console.log('Platform: TokenForge TokenSuite (ERC-1400, eWpG)');
  console.log('\nVerun KYA Check...');

  try {
    const data = await call('POST', '/api/chain/tokens/mint', {
      token_address: '0xBCP-SECURITY-TOKEN-001',
      recipient: GOOD_AGENT,
      amount: '100',
      metadata: { asset_class: 'Private Equity', issuer: 'BCP Partners' },
    }, GOOD_AGENT);

    printResult(data);
    console.log('RESULT: AUTHORIZED — Security Token Minted');
    console.log(' Regulation: ERC-1400 + eWpG compliant');
    console.log(' KYA: Verun verified on-chain');
    console.log('════════════════════════════════════════════\n');
  } catch (err) {
    if (err.response) {
      const d = err.response.data;
      console.log(`\nBLOCKED: ${d.error}`);
      console.log(`Score: ${d.current_score} / ${d.required_score} required`);
    } else {
      console.error(err.message);
    }
  }
}

async function scenarioDLowScoreAgent() {
  printHeader('SCENARIO D2 — Insufficient Score');
  const LOW_AGENT = process.env.LOW_AGENT_ADDRESS || '0x0000000000000000000000000000000000000001';

  console.log(`\nAgent: ${LOW_AGENT}`);
  console.log('Operation: POST /api/chain/tokens/mint');
  console.log('\nVerun KYA Check...');

  try {
    await call('POST', '/api/chain/tokens/mint', { amount: '100' }, LOW_AGENT);
  } catch (err) {
    if (err.response) {
      const d = err.response.data;
      console.log('\n────────────────────────────────────────────');
      console.log(`HTTP Status: ${err.response.status} Forbidden`);
      console.log(`Error: ${d.error}`);
      console.log(`Required Score: ${d.required_score}`);
      console.log(`Current Score: ${d.current_score}`);
      console.log(`Gap: ${d.gap} points needed`);
      console.log(`Regulation: ${d.regulation || 'KYA compliance required for TokenSuite access'}`);
      console.log('────────────────────────────────────────────');
      console.log('RESULT: BLOCKED — KYA Score Insufficient');
      console.log(' No regulated token operation permitted');
      console.log(' Permanent audit entry: agent flagged');
      console.log('════════════════════════════════════════════\n');
    } else {
      console.error(err.message);
    }
  }
}

async function scenarioDOrderFlow() {
  printHeader('SCENARIO D3 — Order Creation (Score >= 600)');
  const GOOD_AGENT = process.env.GOOD_AGENT_ADDRESS || '0x4C8585A50919e05C7881B9428626404F09798Ba6';

  console.log(`\nAgent: ${GOOD_AGENT}`);
  console.log('Operation: POST /api/core/orders/create');
  console.log('Product: BCP Fund I — DACH Private Equity');
  console.log('\nVerun KYA Check (higher threshold: 600)...');

  try {
    const data = await call('POST', '/api/core/orders/create', {
      product_id: 'BCP-FUND-I',
      quantity: 1,
      investor_wallet: GOOD_AGENT,
    }, GOOD_AGENT);

    const o = data.order;
    console.log('\n────────────────────────────────────────────');
    console.log(`Order ID: ${o.id}`);
    console.log(`Product: ${o.product_id}`);
    console.log(`KYC Status: ${o.kyc_status}`);
    console.log(`KYA Status: ${o.kya_status}`);
    console.log(`Compliance: ${o.compliance_check}`);
    console.log(`Status: ${o.status}`);
    console.log('────────────────────────────────────────────');
    console.log('RESULT: ORDER CREATED — Full Compliance Stack');
    console.log(' KYC (human) + KYA (agent) both verified');
    console.log(' MiCAR + eWpG + Verun on-chain audit');
    console.log('════════════════════════════════════════════\n');
  } catch (err) {
    if (err.response) {
      console.log(`\nBLOCKED: ${err.response.data.error}`);
    } else {
      console.error(err.message);
    }
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║ VERUN × TOKENSUITE INTEGRATION DEMO       ║');
  console.log('║ Know Your Agent — Regulated Token Ops     ║');
  console.log('╚════════════════════════════════════════════╝');

  await scenarioDGoodAgent();
  await new Promise((r) => setTimeout(r, 800));
  await scenarioDLowScoreAgent();
  await new Promise((r) => setTimeout(r, 800));
  await scenarioDOrderFlow();
}

main().catch(console.error);
