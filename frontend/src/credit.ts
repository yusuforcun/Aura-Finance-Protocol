import { BrowserProvider, Contract } from "ethers";

const AURA_CONTRACT_ADDRESS = "0x800D9a04687452325E10a87872a60C17f546dF02";
const API_BASE = (import.meta as any).env?.VITE_API_URL || "https://backend-jet-eta-55.vercel.app";
const AURA_CONTRACT_ABI = [
  "function takeCredit(uint256 amount) external",
  "function repay(uint256 amount) external",
  "function closeCredit() external",
  "function getPosition(address user) view returns (uint256 principal, uint256 repaid, bool active, uint256 debt)",
  "function joinBonus(address user) view returns (uint256)",
];

const amountSlider = document.getElementById("amountSlider") as HTMLInputElement | null;
const walletBtn = document.getElementById("walletBtn") as HTMLButtonElement | null;
const confirmBtn = document.getElementById("confirmBtn") as HTMLButtonElement | null;
const summaryPrincipal = document.getElementById("summaryPrincipal");
const summaryTotal = document.getElementById("summaryTotal");
const repayAmountInput = document.getElementById("repayAmount") as HTMLInputElement | null;
const repayBtn = document.getElementById("repayBtn") as HTMLButtonElement | null;
const closeCreditBtn = document.getElementById("closeCreditBtn") as HTMLButtonElement | null;
const txLinkEl = document.getElementById("txLink") as HTMLAnchorElement | null;
const auraScoreBtn = document.getElementById("auraScoreBtn") as HTMLButtonElement | null;
const auraScoreLoading = document.getElementById("auraScoreLoading");
const auraScoreHeader = document.getElementById("auraScoreHeader");
const auraScoreSifat = document.getElementById("auraScoreSifat");
const auraScorePuan = document.getElementById("auraScorePuan");
const auraScoreResult = document.getElementById("auraScoreResult");

let provider: BrowserProvider | null = null;
let contract: Contract | null = null;
let userAddress: string | null = null;
let hasActiveCredit = false;

async function connectWallet() {
  if (!(window as any).ethereum) {
    alert("MetaMask or a compatible Web3 wallet was not found.");
    return;
  }

  provider = new BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  userAddress = await signer.getAddress();

  contract = new Contract(AURA_CONTRACT_ADDRESS, AURA_CONTRACT_ABI, signer);

  if (walletBtn && userAddress) {
    walletBtn.innerText = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)} Connected`;
    walletBtn.style.color = "#2ecc71";
    walletBtn.style.borderColor = "#2ecc71";
  }

  if (auraScoreBtn) {
    auraScoreBtn.disabled = false;
    auraScoreBtn.innerText = "See Aura Score";
  }

  await refreshPosition();
}

async function refreshPosition() {
  if (!contract || !userAddress || !summaryPrincipal || !summaryTotal) return;
  const [principal, , active, debt] = await contract.getPosition(userAddress);
  const principalNum = Number(principal);
  const debtNum = Number(debt);

  summaryPrincipal.innerText = principalNum > 0 ? `${principalNum.toLocaleString()} AURA` : "0 AURA";
  summaryTotal.innerText = debtNum > 0 ? `${debtNum.toLocaleString()} AURA` : "0 AURA";
  hasActiveCredit = Boolean(active) && debtNum > 0;

  // Show "Close Credit" when bonus fully covers debt (debt=0, active=true)
  if (closeCreditBtn) {
    if (active && debtNum === 0) {
      closeCreditBtn.style.display = "inline-block";
      if (repayAmountInput) repayAmountInput.style.display = "none";
      if (repayBtn) repayBtn.style.display = "none";
    } else {
      closeCreditBtn.style.display = "none";
      if (repayAmountInput) repayAmountInput.style.display = "";
      if (repayBtn) repayBtn.style.display = "";
    }
  }

  const bonusRow = document.getElementById("summaryBonusRow");
  const bonusEl = document.getElementById("summaryBonus");
  if (bonusRow && bonusEl) {
    try {
      const bonus = await contract.joinBonus(userAddress);
      const bonusNum = Number(bonus);
      if (bonusNum > 0) {
        bonusEl.textContent = bonusNum.toLocaleString();
        bonusRow.style.display = "flex";
      } else {
        bonusRow.style.display = "none";
      }
    } catch {
      bonusRow.style.display = "none";
    }
  }
}

async function takeCredit() {
  if (!contract || !userAddress || !amountSlider) {
    alert("Please connect your wallet first.");
    return;
  }

  // Warn and block if user already has an active credit
  const [, , active, debt] = await contract.getPosition(userAddress);
  const currentDebt = Number(debt);
  if (active) {
    if (currentDebt > 0) {
      alert("You already have an open credit. Please repay your current debt before taking a new one.");
    } else {
      alert("Your credit is fully covered by bonus. Click 'Close Credit' to close it first.");
    }
    return;
  }

  const isBuyukAdim = (window as any).auraIsBuyukAdim;
  if (isBuyukAdim) {
    const puan = (window as any).auraScorePuan;
    if (typeof puan !== "number") {
      alert("You must check your Aura Score first for Big Step packages.");
      return;
    }
    if (puan < 80) {
      alert(`Your Aura Score is ${puan}/100. Big Step packages require at least 80.`);
      return;
    }
  }

  const getAmount = (window as any).auraGetAmount;
  const amount = getAmount ? getAmount() : parseInt(amountSlider?.value ?? "0", 10);
  if (!amount || amount <= 0) {
    alert("Please select a valid amount.");
    return;
  }

  const tx = await contract.takeCredit(amount);
  const receipt = await tx.wait();
  if (txLinkEl) {
    txLinkEl.href = `https://sepolia.etherscan.io/tx/${tx.hash}`;
    txLinkEl.textContent = "View transaction on Sepolia Etherscan";
    txLinkEl.style.display = "inline";
  }
  await refreshPosition();
  alert("Your credit transaction was written to Sepolia. You can view it on Etherscan.");
}

async function repayCredit() {
  if (!contract || !userAddress) {
    alert("Please connect your wallet first.");
    return;
  }

  const raw = repayAmountInput?.value;
  if (!raw) {
    alert("Please enter the amount you want to repay.");
    return;
  }
  const amount = parseInt(raw, 10);
  if (!amount || amount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

  const tx = await contract.repay(amount);
  const receipt = await tx.wait();
  if (txLinkEl) {
    txLinkEl.href = `https://sepolia.etherscan.io/tx/${tx.hash}`;
    txLinkEl.textContent = "View repayment on Sepolia Etherscan";
    txLinkEl.style.display = "inline";
  }
  if (repayAmountInput) repayAmountInput.value = "";
  await refreshPosition();
  alert("Your repayment was written to Sepolia.");
}

async function closeCredit() {
  if (!contract || !userAddress) {
    alert("Please connect your wallet first.");
    return;
  }

  try {
    const tx = await contract.closeCredit();
    await tx.wait();
    if (txLinkEl) {
      txLinkEl.href = `https://sepolia.etherscan.io/tx/${tx.hash}`;
      txLinkEl.textContent = "View close transaction on Sepolia Etherscan";
      txLinkEl.style.display = "inline";
    }
    await refreshPosition();
    alert("Credit closed. Your remaining bonus is preserved for future use.");
  } catch (e: any) {
    const msg = e?.reason || e?.message || "Transaction failed";
    alert(msg);
  }
}

function init() {
  if (walletBtn) {
    walletBtn.addEventListener("click", () => {
      connectWallet().catch((e) => console.error("Cüzdan bağlama hatası", e));
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      takeCredit().catch((e) => console.error("Kredi alma hatası", e));
    });
  }

  if (repayBtn) {
    repayBtn.addEventListener("click", () => {
      repayCredit().catch((e) => console.error("Repay error", e));
    });
  }

  if (closeCreditBtn) {
    closeCreditBtn.addEventListener("click", () => {
      closeCredit().catch((e) => console.error("Close credit error", e));
    });
  }

  if (auraScoreBtn) {
    auraScoreBtn.addEventListener("click", () => {
      fetchAuraScore().catch((e) => console.error("Aura Skoru hatası", e));
    });
  }
}

async function fetchAuraScore() {
  if (!userAddress) {
    alert("Please connect your wallet first.");
    return;
  }

  if (!auraScoreLoading || !auraScoreResult) return;

  auraScoreLoading.style.display = "block";
  auraScoreResult.style.display = "none";
  auraScoreResult.textContent = "";
  if (auraScoreHeader) auraScoreHeader.style.display = "none";
  if (auraScoreBtn) auraScoreBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/aura-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: userAddress }),
    });

    let json: { error?: string; detail?: string; advice?: string; sifat?: string; puan?: number };
    try {
      json = await res.json();
    } catch {
      throw new Error("Server returned invalid response. Is the backend running? (cd backend && npm run dev)");
    }

    if (!res.ok) {
      const detail = json.detail ? ` (${json.detail})` : "";
      throw new Error((json.error || "İstek başarısız") + detail);
    }

    if (auraScoreHeader && (json.sifat || typeof json.puan === "number")) {
      if (auraScoreSifat) auraScoreSifat.textContent = json.sifat || "";
      if (auraScorePuan) auraScorePuan.textContent = typeof json.puan === "number" ? `${json.puan}/100` : "";
      auraScoreHeader.style.display = "flex";
    }
    auraScoreResult.textContent = json.advice || "Advice unavailable.";
    auraScoreResult.style.display = "block";

    (window as any).auraScorePuan = json.puan;
    const onScoreUpdate = (window as any).auraOnScoreUpdate;
    if (typeof onScoreUpdate === "function") onScoreUpdate(json.puan);
  } catch (err) {
    const msg = (err as Error).message;
    alert(msg.includes("fetch") || msg.includes("Failed") ? "Could not reach backend. Start the API with: cd backend && npm run dev" : msg);
  } finally {
    auraScoreLoading.style.display = "none";
    if (auraScoreBtn) auraScoreBtn.disabled = false;
  }
}

init();

