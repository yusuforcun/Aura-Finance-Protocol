# Risk Log

Risks, mitigations, and status for Aura Finance Protocol.

| ID | Risk | Likelihood | Impact | Mitigation | Status |
|----|------|------------|--------|------------|--------|
| R1 | Smart contract bug (e.g. overflow, reentrancy) | Medium | High | Solidity 0.8 (built-in overflow checks), no external calls in repay/takeCredit; audit of deadlock/bonus fixes | Mitigated |
| R2 | Aura Score LLM hallucination or bias | Medium | Medium | Prompt constraints, JSON output format; score is advisory (Big Step gate only) | Accepted |
| R3 | API key leakage (Groq, OpenAI, private key) | Low | High | .env.example only; no secrets in repo; SECURITY.md guidance | Mitigated |
| R4 | Rate limit bypass or API abuse | Low | Medium | express-rate-limit (10 req/min per IP) on /api/* | Mitigated |
| R5 | User loses MetaMask / private key | High (user) | High | Out of scope; standard Web3 self-custody risk; "How to use?" guidance | Accepted |
| R6 | Sepolia RPC failure or rate limit | Medium | Medium | Fallback RPC (Ankr default); free tier limits documented | Accepted |
| R7 | Frontend CSP / extension conflicts | Low | Low | CSP allows unsafe-eval for Vite/ethers; incognito works | Accepted |
| R8 | Contract not upgradable; logic bugs require redeploy | Medium | Medium | Tests (11 passing); redeploy and update address in env | Mitigated |
| R9 | Join bonus grant fails (no BONUS_SIGNER_PRIVATE_KEY) | High (if unset) | Medium | Backend returns 503 with clear message; README documents requirement | Mitigated |
