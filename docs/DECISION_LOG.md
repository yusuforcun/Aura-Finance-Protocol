# Decision Log

Records of key design and technical decisions for Aura Finance Protocol.

| Date | Decision | Rationale | Alternatives Considered |
|------|----------|-----------|--------------------------|
| 2025-03 | Use Sepolia testnet for credit contract | Free gas, safe for demo; users can test without real funds | Mainnet (rejected: gas costs for users), Polygon (considered for future) |
| 2025-03 | Smart contract stores credit only (no token transfer) | Simplicity; demo showcases credit logic without ERC20 complexity | ERC20 AURA token (rejected: adds deployment + transfer complexity) |
| 2025-03 | Aura Score via LLM (Groq/OpenAI) from on-chain data | No traditional credit bureau; blockchain data is the only input; AI interprets repayment behaviour | Fixed formula (rejected: less flexible), Oracles (rejected: overkill for demo) |
| 2025-03 | Join bonus (50 AURA) on community/event join | Incentivises community participation; reduces debt for engaged users | No bonus (rejected: weaker engagement), Variable bonus (deferred: simpler fixed amount for v1) |
| 2025-03 | MetaMask as sole wallet | Widest adoption; hackathon demo scope | WalletConnect (future), Multi-wallet (future) |
| 2025-03 | Backend grants bonus (owner signs), user pays no gas | Better UX; user doesn't need Sepolia ETH for bonus | User calls claimJoinBonus (requires gas; kept as fallback) |
| 2025-03 | Vite + multi-page HTML (not SPA) | Fast build, clear structure, per-page scripts | React SPA (rejected: heavier for demo scope) |
| 2025-03 | Add closeCredit when debt=0 (bonus covers all) | Fixes deadlock: users could not close when bonus ≥ debt | Force repay of 1 wei (rejected: poor UX, still fails) |
| 2025-03 | Preserve unused bonus on close | Fairness: only deduct bonus used to cover debt | Zero out bonus on close (rejected: state loss, unfair) |
| 2025-03 | hasClaimedJoinBonus prevents double bonus | Prevents grant+claim or claim+claim abuse | Allow double (rejected: exploitable) |
