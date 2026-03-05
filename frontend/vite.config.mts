import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.BASE_PATH || "/",
  root: ".",
  server: {
    headers: {
      "Content-Security-Policy": "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;",
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        login: "login.html",
        "credit-detail": "credit-detail.html",
        "community-finance": "community-finance.html",
        "community-mothers": "community-mothers.html",
        "community-career": "community-career.html",
        "event-workshop": "event-workshop.html",
        "event-investment": "event-investment.html",
        "event-summit": "event-summit.html",
      },
    },
  },
});

