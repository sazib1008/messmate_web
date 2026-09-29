# Deploying MessMate Frontend to Vercel

The MessMate web frontend is fully configured and ready for **1-click deployment to Vercel**.

---

## Configuration Overview

- **Framework**: Vite + React + TypeScript + Tailwind CSS
- **Output Directory**: `dist`
- **Build Command**: `npm run build`
- **Backend API**: Automatically connects to the live Render backend (`https://messmate-backend-nn3j.onrender.com/api`)
- **SPA Client Routing**: Handled via [`vercel.json`](file:///Users/sazibhossainsazib1008/projects/MessMate/frontend/vercel.json) rewrites (all routes redirect to `/index.html` preventing 404s on page refresh).

---

## Deployment Option 1: Deploy via Vercel Web Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **Add New...** $\rightarrow$ **Project**.
3. Import your GitHub repository (`MessMate` or `messmate_frontend`).
4. In the **Configure Project** screen:
   - **Root Directory**: If your repository is the monorepo root, click Edit and select `frontend`. If it is a dedicated frontend repository, leave it as `./`.
   - **Framework Preset**: Select **Vite** (Vercel will auto-detect from `vercel.json`).
   - **Build and Output Settings**:
     - Build Command: `npm run build`
     - Output Directory: `dist`
5. **Environment Variables** (Optional — defaults to live Render backend automatically):
   - `VITE_BACKEND_URL`: `https://messmate-backend-nn3j.onrender.com`
   - `VITE_API_BASE_URL`: `https://messmate-backend-nn3j.onrender.com/api`
6. Click **Deploy**. Vercel will build and assign an SSL-secured `https://<your-project>.vercel.app` domain.

---

## Deployment Option 2: Deploy via Vercel CLI

From the `frontend/` directory, run:

```bash
# 1. Install Vercel CLI globally (if not already installed)
npm install -g vercel

# 2. Deploy to preview
vercel

# 3. Deploy to production
vercel --prod
```

---

## Verification

Once deployed, verify:
1. Load `https://<your-project>.vercel.app` in your browser.
2. Sign in or use the 1-click Quick Login demo accounts.
3. Check browser DevTools Network tab: calls should successfully reach `https://messmate-backend-nn3j.onrender.com/api/...`.
4. Refresh any deep route (e.g. `/manager` or `/student`) to confirm SPA rewrite works without 404.
