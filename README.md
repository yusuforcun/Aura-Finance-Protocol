# Aura – Women's Credit & Community

A decentralized credit showcase for women, with communities and events.

## Structure

- **frontend/** – Vite + TypeScript web app
- **backend/** – Node.js API (Aura Score, Join bonus)
- **blockchain/** – Solidity contract (AuraCredit) on Sepolia

## Run locally

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

### Backend
```bash
cd backend
npm install
cp .env.example .env   # Add GROQ_API_KEY, BONUS_SIGNER_PRIVATE_KEY
npm run dev
```

### Blockchain
```bash
cd blockchain
npm install
npx hardhat compile
npm run deploy:sepolia   # Deploy to Sepolia
```

## Deploy to GitHub Pages

1. **Create GitHub repository**  
   On GitHub: New repository → e.g. `aura-kadin`

2. **Push code**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/aura-kadin.git
   git push -u origin main
   ```

3. **Configure GitHub Pages**
   - Repo → **Settings** → **Pages**
   - **Source:** Deploy from a branch
   - **Branch:** gh-pages, folder: / (root)
   - Workflow pushes build to gh-pages on each push to main

4. **Deploy backend to Vercel**
   ```bash
   cd backend
   npm install -g vercel
   vercel
   ```
   - Follow prompts, link to your GitHub repo if desired.
   - In Vercel dashboard: **Settings → Environment Variables** add:
     - `GROQ_API_KEY` (from https://console.groq.com/keys)
     - `BONUS_SIGNER_PRIVATE_KEY` (optional, for Join bonus)
     - `CORS_ORIGIN` = `https://YOUR_USERNAME.github.io` (your Pages URL)
   - Redeploy after adding env vars.

5. **Add backend URL to GitHub**
   - Repo → **Settings** → **Secrets and variables** → **Actions** → **Variables**
   - **New repository variable:** `VITE_API_URL` = `https://your-backend.vercel.app` (Vercel deployment URL)
   - After this, each push to `main` builds the frontend with the correct API URL.

## Live site

After deployment: `https://YOUR_USERNAME.github.io/aura-kadin/`
