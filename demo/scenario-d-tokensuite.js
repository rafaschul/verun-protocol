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
    console.log('Regulation: ERC-1400 + eWpG compliant');
    console.log('KYA: Verun verified on-chain');
    console.log('════════════════════════════════════════════\n');
  } catch (err) {
    if (err.response) {
      console.log(`\nBLOCKED: ${err.response.data.error}`);
      console.log(`Score: ${err.response.data.current_score} / ${err.response.data.required_score} required`);
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
    const data = await call('POST', '/api/chain/tokens/mint', {
      token_address: '0xBCP-SECURITY-TOKEN-001',
      recipient: LOW_AGENT,
      amount: '100',
    }, LOW_AGENT);
    printResult(data);
  } catch (err) {
    if (err.response) {
      console.log(`BLOCKED: ${err.response.data.error}`);
      console.log(`Required Score: ${err.response.data.required_score}`);
      console.log(`Current Score: ${err.response.data.current_score}`);
      console.log(`Gap: ${err.response.data.gap}`);
    } else {
      console.error(err.message);
    }
  }

  console.log('════════════════════════════════════════════\n');
}

await scenarioDGoodAgent();
await scenarioDLowScoreAgent();
