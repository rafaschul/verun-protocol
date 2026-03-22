#!/usr/bin/env node

/**
 * Synthesis submission helper for Verun Protocol.
 *
 * Usage:
 *   SYNTHESIS_API_TOKEN=... node scripts/synthesis-submit.mjs
 *
 * Optional env:
 *   SYNTHESIS_BASE_URL=https://api.synthesis.builders.garden
 *   SYNTHESIS_TEAM_UUID=07369365319142979c365764d6389d4c
 */

const TEAM_UUID = process.env.SYNTHESIS_TEAM_UUID || '07369365319142979c365764d6389d4c';
const TOKEN = process.env.SYNTHESIS_API_TOKEN;
const BASES = [
  process.env.SYNTHESIS_BASE_URL,
  'https://api.synthesis.builders.garden',
].filter(Boolean);

if (!TOKEN) {
  console.error('❌ Missing SYNTHESIS_API_TOKEN');
  process.exit(1);
}

const verunData = {
  name: 'Verun Protocol',
  tagline: 'Know Your Agent (KYA) trust infrastructure for regulated financial networks',
  shortDescription:
    'Verun scores AI agents, runs validator consensus, and records verdicts on-chain to gate regulated token operations with auditable trust.',
  description: [
    'Verun Protocol is KYA infrastructure for regulated financial networks.',
    'It verifies AI agents before high-risk operations using a deterministic trust score and 2-of-3 validator consensus.',
    'Every verdict is logged on-chain for auditability.',
    '',
    'LIVE NOW (Base Sepolia):',
    '- AgentRegistry: 0x4362794FA4768A3986772275eA0ea113510Cc716',
    '- ValidatorRegistry: 0x838EEf0E97D6c4b5dAd520c662f0cA80c1549fAA',
    '- EvaluationEngine: 0x8B3d26B9259AF379796777fc69fcCf84bd341cef',
    '- AuditLog: 0xe19f690B1423196121C9F3154bb463b9836619ba',
    '- FeeVault: 0x4b7cc355a7c5B127aD0a6fcDAb9B39F225A6Fb85',
    '- MockUSDC: 0x5010fBd165821A851D050AA652B9B3FCB145eF99',
    '',
    'Synthesis registration proof tx:',
    'https://basescan.org/tx/0x1ec3236979286a84400b3c2f67132bd698b2a08fe0173c76c1eec2925fad8fb2',
    '',
    'TokenForge / Bitbond TokenSuite integration demo included: Verun KYA gates regulated token actions by score thresholds.',
  ].join('\n'),
  repoUrl: 'https://github.com/rafaschul/verun-protocol',
  demoUrl: 'https://verun-docs-1-2.vercel.app/',
  websiteUrl: 'https://verun-docs-1-2.vercel.app/',
  docsUrl: 'https://verun-docs-1-2.vercel.app/',
  videoUrl: '',
  teamUuid: TEAM_UUID,
};

function pick(obj, keys) {
  for (const k of keys) {
    if (obj?.[k] != null) return obj[k];
  }
  return undefined;
}

async function req(base, path, method = 'GET', body) {
  const url = `${base}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // non-json response
  }

  return {
    ok: res.ok,
    status: res.status,
    url,
    json,
    text,
  };
}

async function withFailover(fn) {
  let lastErr = null;
  for (const base of BASES) {
    try {
      return await fn(base);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('No API base available');
}

async function main() {
  console.log('🔎 Checking team...');
  const teamResp = await withFailover((base) => req(base, `/teams/${TEAM_UUID}`, 'GET'));
  if (!teamResp.ok) {
    console.error('❌ Team fetch failed:', teamResp.status, teamResp.text);
    process.exit(1);
  }

  const team = teamResp.json?.data || teamResp.json || {};
  let projectId = pick(team, ['projectUuid', 'projectId', 'project'])?.uuid || pick(team, ['projectUuid', 'projectId']);

  if (!projectId) {
    const projects = team.projects || [];
    if (Array.isArray(projects) && projects[0]) {
      projectId = pick(projects[0], ['uuid', 'id', 'projectUuid']);
    }
  }

  if (!projectId) {
    console.log('🛠️ No project found; creating...');

    const createPayloads = [
      {
        teamUuid: TEAM_UUID,
        name: verunData.name,
      },
      {
        teamUuid: TEAM_UUID,
        title: verunData.name,
      },
      {
        teamUuid: TEAM_UUID,
        ...verunData,
      },
    ];

    let createResp = null;
    for (const payload of createPayloads) {
      createResp = await withFailover((base) => req(base, '/projects', 'POST', payload));
      if (createResp.ok) break;
      console.log(`create attempt failed (${createResp.status}), trying next shape...`);
    }

    if (!createResp?.ok) {
      console.error('❌ Project create failed:', createResp?.status, createResp?.text);
      process.exit(1);
    }

    const created = createResp.json?.data || createResp.json || {};
    projectId = pick(created, ['uuid', 'id', 'projectUuid']) || pick(created?.project || {}, ['uuid', 'id']);

    if (!projectId) {
      console.error('❌ Project created but ID missing:', JSON.stringify(createResp.json, null, 2));
      process.exit(1);
    }
  }

  console.log('✍️ Updating project:', projectId);

  const updatePayloads = [
    {
      name: verunData.name,
      tagline: verunData.tagline,
      shortDescription: verunData.shortDescription,
      description: verunData.description,
      repoUrl: verunData.repoUrl,
      demoUrl: verunData.demoUrl,
      websiteUrl: verunData.websiteUrl,
      docsUrl: verunData.docsUrl,
      videoUrl: verunData.videoUrl,
    },
    {
      title: verunData.name,
      summary: verunData.shortDescription,
      content: verunData.description,
      githubUrl: verunData.repoUrl,
      website: verunData.websiteUrl,
      demo: verunData.demoUrl,
      video: verunData.videoUrl,
    },
    {
      teamUuid: TEAM_UUID,
      ...verunData,
    },
  ];

  let updateResp = null;
  for (const method of ['PATCH', 'PUT']) {
    for (const payload of updatePayloads) {
      updateResp = await withFailover((base) => req(base, `/projects/${projectId}`, method, payload));
      if (updateResp.ok) break;
    }
    if (updateResp?.ok) break;
  }

  if (!updateResp?.ok) {
    console.error('❌ Project update failed:', updateResp?.status, updateResp?.text);
    process.exit(1);
  }

  console.log('🚀 Preparing publish...');
  const publishAttempts = [
    (base) => req(base, `/projects/${projectId}/publish`, 'POST', {}),
    (base) => req(base, `/projects/publish`, 'POST', { projectUuid: projectId }),
    (base) => req(base, `/projects/${projectId}`, 'POST', { action: 'publish' }),
  ];

  let publishResp = null;
  for (const attempt of publishAttempts) {
    publishResp = await withFailover(attempt);
    if (publishResp.ok) break;
  }

  if (!publishResp?.ok) {
    console.log('⚠️ Publish endpoint not accepted yet. Project is created + updated and ready.');
    console.log('Project ID:', projectId);
    console.log('Last publish response:', publishResp?.status, publishResp?.text);
    process.exit(2);
  }

  console.log('✅ Published successfully');
  console.log(JSON.stringify(publishResp.json || { status: publishResp.status, text: publishResp.text }, null, 2));
}

main().catch((err) => {
  console.error('❌ Fatal error:', err?.message || err);
  process.exit(1);
});
