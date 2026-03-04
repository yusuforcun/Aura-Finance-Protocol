// Small script to show logged-in state on the main page

function markLoggedInIfNeeded() {
  const loginLink = document.getElementById("login-link") as HTMLAnchorElement | null;
  if (!loginLink) return;

  let loggedIn = false;
  try {
    loggedIn = sessionStorage.getItem("aura_demo_logged_in") === "true";
  } catch {
    loggedIn = false;
  }

  if (!loggedIn) return;

  loginLink.textContent = "Logged In";
  loginLink.title = "You are already logged in";
  loginLink.style.opacity = "0.6";
  loginLink.style.cursor = "default";

  loginLink.addEventListener("click", (e) => {
    e.preventDefault();
  });
}

markLoggedInIfNeeded();

