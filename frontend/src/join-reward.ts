/**
 * Join button + reward popup for community and event pages.
 * Backend (owner) signs grantJoinBonus - 50 AURA drops on-chain. User pays no gas.
 */
const API_BASE = (import.meta as any).env?.VITE_API_URL || "https://backend-jet-eta-55.vercel.app";

function getPageId(): string {
  const path = window.location.pathname;
  const match = path.match(/\/([^/]+)\.html/);
  return match ? match[1] : "default";
}

function showRewardModal(rewardCode: string, rewardText: string) {
  const overlay = document.getElementById("reward-overlay");
  const codeEl = document.getElementById("reward-code");
  const textEl = document.getElementById("reward-text");
  const closeBtn = document.getElementById("reward-close");
  if (!overlay || !codeEl) return;

  if (textEl) textEl.textContent = rewardText;
  codeEl.textContent = rewardCode;
  overlay.style.display = "flex";

  const hide = () => {
    (overlay as HTMLElement).style.display = "none";
  };
  closeBtn?.addEventListener("click", hide, { once: true });
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hide();
  }, { once: true });
}

function showErrorModal(message: string) {
  const overlay = document.getElementById("reward-overlay");
  const codeEl = document.getElementById("reward-code");
  const textEl = document.getElementById("reward-text");
  const titleEl = overlay?.querySelector("h3");
  const closeBtn = document.getElementById("reward-close");
  if (!overlay || !textEl) return;

  if (titleEl) titleEl.textContent = "Something went wrong";
  textEl.textContent = message;
  if (codeEl) codeEl.style.display = "none";

  const hide = () => {
    (overlay as HTMLElement).style.display = "none";
    if (codeEl) codeEl.style.display = "";
  };
  closeBtn?.addEventListener("click", hide, { once: true });
  overlay.addEventListener("click", (e) => { if (e.target === overlay) hide(); }, { once: true });
  overlay.style.display = "flex";
}

async function connectWallet(): Promise<string | null> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) {
    alert("Please install MetaMask or a Web3 wallet.");
    return null;
  }
  const { BrowserProvider } = await import("ethers");
  const provider = new BrowserProvider(ethereum);
  const signer = await provider.getSigner();
  return signer.getAddress();
}

async function grantBonusViaBackend(walletAddress: string, pageId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/grant-join-bonus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress, pageId }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.detail || data.error || "Request failed" };
    }
    return { success: true };
  } catch (e) {
    const msg = (e as Error).message;
    return { success: false, error: msg.includes("fetch") ? "Could not reach backend. Is the API running?" : msg };
  }
}

function init() {
  const btn = document.getElementById("joinBtn") as HTMLButtonElement | null;
  const walletBtn = document.getElementById("joinWalletBtn") as HTMLButtonElement | null;
  if (!btn) return;

  const rewardCode = btn.dataset.rewardCode || "AURA-WELCOME-50";
  const rewardText = btn.dataset.rewardText || "50 AURA bonus granted! It reduces your debt when you take credit.";
  const pageId = getPageId();
  const storageKey = `aura_joined_${pageId}`;

  let walletAddress: string | null = null;

  async function updateWalletState(addr: string | null) {
    walletAddress = addr;
    if (walletBtn) {
      if (addr) {
        walletBtn.textContent = `${addr.slice(0, 6)}...${addr.slice(-4)} ✓`;
        walletBtn.style.background = "rgba(46, 204, 113, 0.2)";
        walletBtn.style.color = "#27ae60";
      } else {
        walletBtn.textContent = "Connect wallet to join";
        walletBtn.style.background = "";
        walletBtn.style.color = "";
      }
    }
  }

  walletBtn?.addEventListener("click", async () => {
    const addr = await connectWallet();
    if (addr) await updateWalletState(addr);
  });

  try {
    if (sessionStorage.getItem(storageKey) === "true") {
      btn.textContent = "Joined ✓";
      btn.disabled = true;
      btn.style.opacity = "0.85";
      return;
    }
  } catch {
    /* ignore */
  }

  btn.addEventListener("click", async () => {
    if (!walletAddress) {
      const addr = await connectWallet();
      if (!addr) return;
      await updateWalletState(addr);
    }

    if (!walletAddress) {
      showErrorModal("Please connect your wallet first.");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Claiming...";

    const result = await grantBonusViaBackend(walletAddress, pageId);

    if (result.success) {
      try {
        sessionStorage.setItem(storageKey, "true");
      } catch {
        /* ignore */
      }
      btn.textContent = "Joined ✓";
      btn.style.opacity = "0.85";
      showRewardModal(rewardCode, rewardText);
    } else {
      btn.disabled = false;
      btn.textContent = "Join";
      showErrorModal(result.error || "Could not grant bonus.");
    }
  });
}

init();
