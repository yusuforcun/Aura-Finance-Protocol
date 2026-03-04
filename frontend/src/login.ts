const loginBtn = document.getElementById("loginBtn") as HTMLButtonElement | null;
const emailInput = document.getElementById("email") as HTMLInputElement | null;
const passwordInput = document.getElementById("password") as HTMLInputElement | null;
const contractBox = document.getElementById("contract-box") as HTMLDivElement | null;
const contractAddressEl = document.getElementById("contract-address") as HTMLDivElement | null;
const contractPopup = document.getElementById("contract-popup") as HTMLDivElement | null;
const popupAddressEl = document.getElementById("popup-contract-address") as HTMLDivElement | null;
const popupCloseBtn = document.getElementById("popupCloseBtn") as HTMLButtonElement | null;

function generateRandomAddress(): string {
  const hexChars = "0123456789abcdef";
  let addr = "0x";
  for (let i = 0; i < 40; i++) {
    addr += hexChars[Math.floor(Math.random() * hexChars.length)];
  }
  return addr;
}

function fakeRegisterOrLogin() {
  if (!emailInput || !passwordInput) return;
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Please fill in email and password.");
    return;
  }

  // Fake user stored for this session only (cleared when page/tab closes)
  sessionStorage.setItem("aura_demo_user_email", email);

  const demoAddress = generateRandomAddress();
  if (contractAddressEl && contractBox) {
    contractAddressEl.textContent = demoAddress;
    contractBox.style.display = "block";
  }
  if (popupAddressEl && contractPopup) {
    popupAddressEl.textContent = demoAddress;
    contractPopup.style.display = "flex";
  }
}

function init() {
  if (!loginBtn || !popupCloseBtn) return;

  loginBtn.addEventListener("click", () => {
    fakeRegisterOrLogin();
  });

  popupCloseBtn.addEventListener("click", () => {
    if (contractPopup) contractPopup.style.display = "none";
    try {
      sessionStorage.setItem("aura_demo_logged_in", "true");
    } catch {
      // ignore
    }
    window.location.href = "index.html";
  });
}

init();

