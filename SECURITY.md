# Security and Deployment Guide

## Secret Files (Never Commit to GitHub)

The following files must **never** be committed:

- `backend/.env` — API keys (GROQ, OpenAI)
- `blockchain/.env` — Wallet private key, RPC URL
- `frontend/.env` — Vite environment variables

## Pre-Release Checklist

1. **Check `.env` files**
   - Run `git status` and ensure no `.env` files are staged
   - If you already committed them, use `git filter-branch` or BFG to remove from history

2. **Rotate API keys**
   - If `.env` was accidentally shared, revoke Groq/OpenAI and Alchemy keys immediately and create new ones
   - Create a new wallet for the `PRIVATE_KEY` in `blockchain/.env` and move funds

3. **User data**
   - Wallet addresses are already public on-chain
   - Email/password are only stored in `sessionStorage` and are not sent to the server
   - Backend only receives wallet address; no personal data is stored

## Deployment Environment Variables

### Backend (Vercel, Railway, etc.)
- `GROQ_API_KEY` or `OPENAI_API_KEY`
- `PORT` (optional)
- `SEPOLIA_RPC_URL` (optional)
- `BONUS_SIGNER_PRIVATE_KEY` — Contract owner key for granting 50 AURA join bonus (required for Join to work)
- `AURA_CONTRACT_ADDRESS` — New address after redeploying the updated AuraCredit contract

### Join bonus (50 AURA on community/event join)
The AuraCredit contract has a `grantJoinBonus` function. You must:
1. Redeploy the contract: `cd blockchain && npm run deploy:sepolia`
2. Set `AURA_CONTRACT_ADDRESS` in backend `.env` to the new address
3. Set `BONUS_SIGNER_PRIVATE_KEY` to the deployer's private key (same as `blockchain/.env` PRIVATE_KEY)
4. Update the contract address in `frontend/src/credit.ts` if needed

### Frontend
- `VITE_API_URL` — Production backend API URL (e.g. `https://aura-api.vercel.app`)
