import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { JsonRpcProvider, Contract, Wallet } from "ethers";
import OpenAI from "openai";

const app = express();

const corsOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://yusuforcun.github.io",
  "http://yusufufus.com.tr",
  "https://yusufufus.com.tr",
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim()) : []),
];
// Allow any origin in production to avoid CORS issues (reflect request origin)
app.use(cors({ origin: true, credentials: false }));
app.use(express.json());

// Rate limit: max 10 requests per minute per IP (prevents AI abuse / infinite loop)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many requests", detail: "Please wait a minute before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

const PORT = process.env.PORT || 3000;
const AURA_CONTRACT = process.env.AURA_CONTRACT_ADDRESS || "0x800D9a04687452325E10a87872a60C17f546dF02";
const AURA_ABI = [
  "event CreditTaken(address indexed user, uint256 principal, uint256 totalDebt)",
  "event CreditRepaid(address indexed user, uint256 amount, uint256 remainingDebt)",
  "event JoinBonusGranted(address indexed user, uint256 amount)",
  "function getPosition(address user) view returns (uint256 principal, uint256 repaid, bool active, uint256 debt)",
  "function grantJoinBonus(address to) external",
  "function joinBonus(address user) view returns (uint256)",
];

const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL || "https://rpc.ankr.com/eth_sepolia";
const provider = new JsonRpcProvider(SEPOLIA_RPC);
const contract = new Contract(AURA_CONTRACT, AURA_ABI, provider);

let contractWithSigner = null;
if (process.env.BONUS_SIGNER_PRIVATE_KEY) {
  const signer = new Wallet(process.env.BONUS_SIGNER_PRIVATE_KEY, provider);
  contractWithSigner = new Contract(AURA_CONTRACT, AURA_ABI, signer);
}

async function fetchOnChainData(walletAddress) {
  const [principal, repaid, active, debt] = await contract.getPosition(walletAddress);
  const p = Number(principal);
  const r = Number(repaid);
  const d = Number(debt);

  // Free RPCs impose 10-block limit on eth_getLogs; we use getPosition only
  let takenHistory = [];
  let repaidHistory = [];
  try {
    const block = await provider.getBlockNumber();
    const fromBlock = Math.max(0, block - 9); // 10 block range (free tier limit)
    const creditTakenFilter = contract.filters.CreditTaken(walletAddress);
    const creditRepaidFilter = contract.filters.CreditRepaid(walletAddress);
    const [takenEvents, repaidEvents] = await Promise.all([
      contract.queryFilter(creditTakenFilter, fromBlock, block),
      contract.queryFilter(creditRepaidFilter, fromBlock, block),
    ]);
    takenHistory = takenEvents.map((e) => ({
      principal: Number(e.args.principal),
      totalDebt: Number(e.args.totalDebt),
    }));
    repaidHistory = repaidEvents.map((e) => ({
      amount: Number(e.args.amount),
      remainingDebt: Number(e.args.remainingDebt),
    }));
  } catch (e) {
    // If event query fails (free tier limit etc.) skip; getPosition is sufficient
  }

  return {
    position: { principal: p, repaid: r, active, debt: d },
    history: { taken: takenHistory, repaid: repaidHistory },
  };
}

app.post("/api/aura-score", async (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress || typeof walletAddress !== "string") {
    return res.status(400).json({ error: "walletAddress is required" });
  }

  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!groqKey && !openaiKey) {
    return res.status(500).json({
      error: "GROQ_API_KEY or OPENAI_API_KEY must be set in .env",
    });
  }

  try {
    const data = await fetchOnChainData(walletAddress);

    const prompt = `You are Aura Women's Fund's personalized financial advisor AI.
The user's on-chain data from the AuraCredit contract on Sepolia is below.

## On-chain data:
- Current position: Principal ${data.position.principal} AURA, Repaid ${data.position.repaid} AURA, Active: ${data.position.active}, Remaining debt: ${data.position.debt} AURA
- Credit history: ${JSON.stringify(data.history.taken)}
- Repayment history: ${JSON.stringify(data.history.repaid)}

Respond ONLY in this JSON format, no extra text:
{"sifat":"...","puan":XX,"tavsiye":"..."}

Rules:
- sifat: Creative title for the user (e.g. Aura Apprentice, Future Visionary, Consistent Payer, Model Borrower, New Starter, Financial Awareness Star, Safe Steps Master)
- puan: Integer 0-100 (no debt + clean history: 70-90, new starter: 50-70, high debt: 30-50)
- tavsiye: 2-3 sentences in English, empowering tone, address user directly, max 120 words`;

    let raw = "";
    // Groq free quota is generous; try it first
    if (groqKey) {
      try {
        const groq = new OpenAI({
          apiKey: groqKey,
          baseURL: "https://api.groq.com/openai/v1",
        });
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 400,
        });
        raw = completion.choices[0]?.message?.content?.trim() || "";
      } catch (e) {
        if (openaiKey) {
          const openai = new OpenAI({ apiKey: openaiKey });
          const c = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 400,
          });
          raw = c.choices[0]?.message?.content?.trim() || "";
        } else throw e;
      }
    } else {
      const openai = new OpenAI({ apiKey: openaiKey });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
      });
      raw = completion.choices[0]?.message?.content?.trim() || "";
    }

    let sifat = "Evaluation";
    let puan = 0;
    let advice = "Analysis could not be completed.";
    try {
      const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim());
      if (parsed.sifat) sifat = parsed.sifat;
      if (typeof parsed.puan === "number") puan = Math.min(100, Math.max(0, Math.round(parsed.puan)));
      if (parsed.tavsiye) advice = parsed.tavsiye;
    } catch (e) {
      advice = raw || advice;
    }

    res.json({ success: true, sifat, puan, advice, data });
  } catch (err) {
    console.error("Aura Score error:", err);
    let msg = err.message || "Unexpected error";
    if (err.status === 429 || (msg && msg.includes("quota"))) {
      msg += ". Fix: add GROQ_API_KEY to backend/.env (free: https://console.groq.com/keys)";
    }
    res.status(500).json({
      error: "Could not get Aura Score",
      detail: msg,
    });
  }
});

app.post("/api/grant-join-bonus", async (req, res) => {
  const { walletAddress, pageId } = req.body;
  if (!walletAddress || typeof walletAddress !== "string") {
    return res.status(400).json({ error: "walletAddress is required" });
  }

  if (!contractWithSigner) {
    return res.status(503).json({
      error: "Join bonus not configured. Set BONUS_SIGNER_PRIVATE_KEY in backend .env",
    });
  }

  const addr = walletAddress.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    return res.status(400).json({ error: "Invalid wallet address" });
  }

  try {
    const tx = await contractWithSigner.grantJoinBonus(addr);
    await tx.wait();
    res.json({
      success: true,
      message: "50 AURA bonus granted",
      txHash: tx.hash,
    });
  } catch (err) {
    console.error("Grant join bonus error:", err);
    let msg = err.message || "Transaction failed";
    if (msg.includes("user rejected") || msg.includes("denied")) {
      msg = "Transaction was rejected";
    }
    res.status(500).json({
      error: "Could not grant bonus",
      detail: msg,
    });
  }
});

if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => console.log(`Aura API http://localhost:${PORT}`));
}

export default app;
