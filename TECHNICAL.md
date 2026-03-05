# Aura Finance Protocol – Technical Documentation

## Overview

Aura is a decentralized credit showcase for women, with communities, events, and AI-powered Aura Score. This document describes the technologies used in the project.

---

## 1. Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Vite** | 5.x | Build tool, dev server, fast HMR |
| **TypeScript** | — | Typed JavaScript (credit.ts, join-reward.ts, login.ts) |
| **Ethers.js** | 6.11.x | Blockchain interaction (MetaMask, Sepolia) |
| **HTML/CSS** | — | Multi-page app (9 HTML pages) |

### Structure

```
frontend/
├── index.html              # Home
├── login.html
├── credit-detail.html      # Credit package selection & repayment
├── community-*.html        # 3 community pages
├── event-*.html            # 3 event pages
├── vite.config.mts
└── src/
    ├── main.ts             # Entry
    ├── credit.ts           # Credit logic, Aura Score, repayment
    ├── login.ts            # Wallet connect
    └── join-reward.ts      # Community/event Join, 50 AURA bonus
```

### Build

- **Base path:** `/${{ repo.name }}/` (e.g. `/Aura-Finance-Protocol/`)
- **Entry points:** 9 HTML files in `rollupOptions.input`
- **API base URL:** `https://backend-jet-eta-55.vercel.app` (Vite env)

---

## 2. Backend (API)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20+ | Runtime |
| **Express** | 4.21.x | HTTP server |
| **CORS** | 2.8.x | Cross-origin requests |
| **Ethers.js** | 6.11.x | Sepolia RPC, contract reads, owner transactions |
| **OpenAI** | 4.77.x | Groq/OpenAI API client (Aura Score) |
| **express-rate-limit** | 8.2.x | Rate limiting (10 req/min per IP) |
| **dotenv** | 16.4.x | Environment variables |

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/aura-score` | AI-generated Aura Score from on-chain data |
| POST | `/api/grant-join-bonus` | Owner-signs 50 AURA Join bonus |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes* | Groq API key (preferred) |
| `OPENAI_API_KEY` | Yes* | OpenAI fallback |
| `BONUS_SIGNER_PRIVATE_KEY` | No | Owner key for Join bonus |
| `AURA_CONTRACT_ADDRESS` | No | Default Sepolia contract |
| `SEPOLIA_RPC_URL` | No | RPC URL (default: Ankr) |
| `CORS_ORIGIN` | No | Allowed origins (optional) |

*At least one of `GROQ_API_KEY` or `OPENAI_API_KEY` is required for Aura Score.

### Rate Limiting

- **Scope:** `/api/*`
- **Limit:** 10 requests per minute per IP
- **Response:** 429 JSON with error message

---

## 3. Blockchain

| Technology | Version | Purpose |
|------------|---------|---------|
| **Solidity** | ^0.8.20 | Smart contract |
| **Hardhat** | 2.22.x | Compile & deploy |
| **Hardhat Toolbox** | 4.x | Test & deployment helpers |
| **Ethers** | (via Toolbox) | Contract interaction |

### Contract: AuraCredit.sol

- **Network:** Sepolia (testnet)
- **Features:**
  - `takeCredit(amount)` – open credit
  - `repay(amount)` – repay debt
  - `getPosition(user)` – view position
  - `grantJoinBonus(to)` – owner grants 50 AURA bonus
  - `joinBonus(user)` – view bonus balance
- **Events:** `CreditTaken`, `CreditRepaid`, `JoinBonusGranted`

### Deployment

```bash
cd blockchain
npm run deploy:sepolia
```

Requires: `PRIVATE_KEY`, `SEPOLIA_RPC_URL` in `.env`.

---

## 4. Deployment & Hosting

| Component | Platform | Details |
|-----------|----------|---------|
| **Frontend** | GitHub Pages | `gh-pages` branch, base path `/Aura-Finance-Protocol/` |
| **Backend** | Vercel | Serverless (Express → `@vercel/node`) |
| **CI/CD** | GitHub Actions | Build & deploy on push to `main` |
| **Blockchain** | Sepolia | Public testnet |

### GitHub Actions Workflow

- **Trigger:** Push to `main`
- **Steps:**
  1. Checkout
  2. Node 20
  3. `npm install` + `npm run build` (frontend)
  4. `peaceiris/actions-gh-pages` → push to `gh-pages`

### Vercel (Backend)

- **Framework:** Node.js
- **Build:** `index.js` as serverless function
- **Config:** `backend/vercel.json` (routes, `@vercel/node`)

---

## 5. External Services

| Service | Use |
|---------|-----|
| **MetaMask** | Wallet connect, transactions |
| **Chainlist** | Add Sepolia to MetaMask |
| **Google Cloud Faucet** | Sepolia test ETH |
| **Groq API** | Aura Score (LLM, preferred) |
| **OpenAI API** | Aura Score fallback |
| **Ankr RPC** | Sepolia JSON-RPC (default) |

---

## 6. Project Structure

```
Aura-Finance-Protocol/
├── frontend/           # Vite + TS + HTML
│   ├── src/
│   ├── *.html
│   └── vite.config.mts
├── backend/            # Express API
│   ├── index.js
│   ├── vercel.json
│   └── package.json
├── blockchain/         # Hardhat + Solidity
│   ├── contracts/
│   │   └── AuraCredit.sol
│   ├── scripts/
│   └── hardhat.config.js
├── .github/
│   └── workflows/
│       └── deploy.yml
├── README.md
├── SECURITY.md
└── TECHNICAL.md
```

---

## 7. URLs

| Purpose | URL |
|---------|-----|
| Live site | `https://yusuforcun.github.io/Aura-Finance-Protocol/` |
| Backend API | `https://backend-jet-eta-55.vercel.app` |
| Sepolia contract | (set in `.env` / deployment) |

---

*Last updated: March 2025*
