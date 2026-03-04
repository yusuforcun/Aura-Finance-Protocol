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
   - **Source:** GitHub Actions
   - Workflow will run on each push to `main`

4. **Optional: API URL**  
   Repo → **Settings** → **Secrets and variables** → **Actions** → **Variables**  
   Add `VITE_API_URL` with your backend URL (e.g. Vercel).

5. **Backend deployment**  
   Deploy the backend (e.g. Vercel, Railway) and use its URL as `VITE_API_URL`.

## Live site

After deployment: `https://YOUR_USERNAME.github.io/aura-kadin/`
