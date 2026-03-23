# Verun Protocol

Know Your Agent (KYA) infrastructure for regulated financial networks.

## What it does

Verun scores AI agents, routes risk decisions through validator consensus, and records every verdict on-chain for auditability. It separates normal approvals from blocked actions and enforces deterministic fee logic with score-based kickbacks. The result is a transparent trust layer for agent-to-agent operations in regulated finance.

## Live Links (current submission state)

- Live Demo: https://verun-protocol.vercel.app/
- Repository: https://github.com/rafaschul/verun-protocol
- Backup docs (older deployment line): https://verun-docs-1-2.vercel.app/

## Live Contracts (Base Sepolia)

- MockUSDC: `0x5010fBd165821A851D050AA652B9B3FCB145eF99`  
  https://sepolia.basescan.org/address/0x5010fBd165821A851D050AA652B9B3FCB145eF99
- AgentRegistry: `0x4362794FA4768A3986772275eA0ea113510Cc716`  
  https://sepolia.basescan.org/address/0x4362794FA4768A3986772275eA0ea113510Cc716
- ValidatorRegistry: `0x838EEf0E97D6c4b5dAd520c662f0cA80c1549fAA`  
  https://sepolia.basescan.org/address/0x838EEf0E97D6c4b5dAd520c662f0cA80c1549fAA
- EvaluationEngine: `0x8B3d26B9259AF379796777fc69fcCf84bd341cef`  
  https://sepolia.basescan.org/address/0x8B3d26B9259AF379796777fc69fcCf84bd341cef
- AuditLog: `0xe19f690B1423196121C9F3154bb463b9836619ba`  
  https://sepolia.basescan.org/address/0xe19f690B1423196121C9F3154bb463b9836619ba
- FeeVault: `0x4b7cc355a7c5B127aD0a6fcDAb9B39F225A6Fb85`  
  https://sepolia.basescan.org/address/0x4b7cc355a7c5B127aD0a6fcDAb9B39F225A6Fb85

## Fee Distribution

- 70% treasury
- 10% validator
- 10% kickback
- 10% reserve

Kickback policy:
- Score 500–799 → 5%
- Score 800+ → 10%

## Run Demo

```bash
npm install
node demo/scenario-a-good-agent.js
node demo/scenario-b-scam-agent.js
node demo/scenario-c-new-agent.js
```

## Architecture

- **AgentRegistry**: stores agent profile and score fields used for trust tiering.
- **ValidatorRegistry**: stores validator metadata and revenue wallet mapping.
- **EvaluationEngine**: receives 2-of-3 validator signatures and emits verdict events.
- **AuditLog**: stores verdict history and slashing evidence events.
- **FeeVault**: charges and distributes fees with score-based kickback outcomes.
- **MockUSDC**: 6-decimal test stablecoin used for testnet settlement.

## Hackathon

The Synthesis — `synthesis.md`  
Deadline: 22. März 2026

## TokenForge TokenSuite Integration

Verun acts as the KYA (Know Your Agent) trust gate for TokenForge's TokenSuite live API.

### What it solves

TokenSuite already has KYC/AML for human investors. Verun adds KYA — Know Your Agent — for AI agents operating on regulated token infrastructure.

Full compliance stack:
- Human investor → KYC/AML (TokenSuite Core Backend)
- AI Agent → KYA (Verun Protocol)
- Token operation → ERC-1400 + eWpG (TokenSuite Chain API)
- Audit trail → on-chain (Verun + Base Sepolia)

### Score Requirements

| Operation | Verun Score | Why |
|---|---|---|
| Read wallet balance | 300+ | Low risk |
| Mint security token | 500+ | Regulated operation |
| Transfer token | 500+ | Regulated operation |
| Create order | 600+ | Higher financial risk |

### Run TokenSuite Demo

```bash
# Terminal 1 — Start mock TokenSuite API
npm run tokensuite:api

# Terminal 2 — Run integration demo
npm run demo:tokensuite
```

### Live API Endpoints (TokenForge Staging)
- Chain API: https://apiv2.stg.tokenforge.technology/swagger/
- Launchpad: https://headlesssto-api.stg.tokenforge.technology/api/v2
- GraphQL: https://headlesssto-api.stg.tokenforge.technology/api/v2/graphql/graphql_playground

---

## FUTURE POTENTIAL — LANGFRISTIG (aus TKFG Litepaper)

*Diese Features sind noch nicht live — aber sie zeigen wohin die Reise geht:*

ECHOLAYER (in development):
- Cross-Platform Agent Identity
- Verun Score portabel zwischen TokenSuite Instances
- Agent der auf Plattform A guten Score hat → automatisch trusted auf Plattform B

IRIS AI Layer (in planning):
- AI Intelligence für Issuers
- Wenn IRIS als AI Agent auf sensitive Issuer Daten zugreift → Verun KYA Gate
- Höchster Trust Level: Score 900+
- Nur verifizierte, gesponserte AI Agents dürfen auf Investment Intelligence zugreifen

$TKFG TOKEN UTILITY:
- Agents die $TKFG halten bekommen automatischen Score Bonus (+50)
- Incentive für Token Adoption
- Verun als natürlicher Part des TKFG Ecosystems

**Diese Roadmap macht Verun zum natürlichen Partner**
**für TokenForge's gesamte Ecosystem Evolution.**

---

## STRATEGISCHE BEDEUTUNG

HEUTE (Hackathon Demo):
- Verun gated die live TokenSuite Chain API
- Echter KYA Use Case in reguliertem RWA Kontext
- TokenForge = erster Validator Partner

NACH HACKATHON:
- Pitch an TokenForge für echte Integration
- Algorand Foundation Grant: "KYA Infrastructure für MiCAR-compliant RWA Token Platforms auf Algorand"

APRIL 2026 — Berlin Agentic Commerce Hackathon:
- Verun + TokenSuite + x402 = perfekte Submission
- "AI Agents die regulierte Assets handeln brauchen KYA — wir haben es gebaut"

LANGFRISTIG:
- Jede der 30+ TokenSuite Platforms wird ein Verun Validator
- 10% Revenue Share automatisch → Passive Revenue aus echtem RWA Ecosystem

---

## PRIORITÄT FÜR KITE

WENN Dashboard (Day 4) fertig:
- Task 1: Validator registrieren (30 min)
- Task 2: Middleware (45 min)
- Task 3: Mock API Server (60 min)
- Task 4: Demo Script (30 min)
- Task 5+6: Config + README (15 min)
- GESAMT: ~3 Stunden

WENN Zeit knapp:
- Nur Task 3 + Task 4 reichen für Demo
- Mock API + Script zeigen den Flow
- Judges sehen: regulierter RWA Use Case

---

*verun.network × tokenforge.io*  
*Know Your Agent — für regulierte Security Token Infrastruktur*  
*ERC-1400 | eWpG | MiCAR | Verun KYA*
