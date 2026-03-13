# Verun Protocol

Sybil-resistance for AI agents.

> Every major payment company is building their own agent trust layer.
> Visa won't trust Stripe's. JPMorgan won't trust Coinbase's.
> They all need neutral Sybil-resistance infrastructure underneath.
> That is Verun.

## How it works
- Agent registers (wallet + USDC stake)
- Every action → validator consensus (2-of-3)
- Risk tier: LOW / MED / HIGH / BLOCK
- Verdict anchored on Arbitrum
- Fee: 0.001 USDC per evaluation
- Scam agents blocked + slashing event on-chain

## Tech Stack
- Solidity 0.8.x + Hardhat
- Node.js validator services
- Next.js dashboard
- Arbitrum Sepolia testnet

## Hackathon
The Synthesis — synthesis.md  
Deadline: March 22, 2026  
verun.network
