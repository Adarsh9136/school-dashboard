# Deploying Resonance ERP

The workspace root already contains an Emergent-managed `vercel.json` used by the preview environment — **do not overwrite it**. All Vercel-specific deployment files ship as follows:

```
frontend/vercel.json               ← Frontend-only Vercel project (recommended path)
frontend/.env.example              ← Frontend env template
backend/.env.example               ← Backend env template
backend/api/index.js               ← Serverless entry (only used with monorepo Vercel setup)
vercel.monorepo.example.json       ← Rename to vercel.json if you want ONE Vercel project for both
```

---

## Option A — Recommended: split deployment

Frontend on Vercel, backend on Render / Railway / Fly (Node servers with persistent connections are cheaper and simpler for Express + Mongoose than serverless).

### 1. Backend on Render (or Railway / Fly)

1. Create a new **Web Service** pointed at your `/backend` directory.
2. Build command: `yarn install`
3. Start command: `node server.js`
4. Environment variables (from `backend/.env.example`):
   - `MONGO_URL` – your MongoDB Atlas SRV string
   - `DB_NAME` – e.g. `resonance_erp`
   - `JWT_SECRET` – long random string (`openssl rand -base64 48`)
   - `PORT` – Render/Railway set this automatically; leave empty locally
   - `CORS_ORIGINS` – your Vercel frontend URL, e.g. `https://resonance.vercel.app`
5. After first deploy, run the seed once from the Render Shell: `node seed.js`
6. Note the public backend URL, e.g. `https://resonance-api.onrender.com`.

### 2. Frontend on Vercel

1. New Vercel project → **Root Directory = `frontend`**.
2. Framework auto-detects as **Create React App** (already declared in `frontend/vercel.json`).
3. Add one environment variable:
   - `REACT_APP_BACKEND_URL` = `https://resonance-api.onrender.com` (no trailing slash)
4. Deploy. Vercel picks up `frontend/vercel.json` for SPA rewrites and cache headers automatically.

---

## Option B — Everything on Vercel (monorepo, serverless)

Use only if you want a single Vercel project. Express becomes a serverless function.

1. Rename `vercel.monorepo.example.json` → `vercel.json` at the workspace root (you'll first need to move Emergent's existing `vercel.json` out of the way; only do this **after** you leave the Emergent preview environment).
2. In Vercel project settings:
   - **Root Directory** = repo root
   - Build/Install/Output commands are already declared in the config.
3. Environment variables — set BOTH sets:
   - `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `CORS_ORIGINS` (backend)
   - `REACT_APP_BACKEND_URL` = leave blank OR set to your Vercel domain (frontend will call `/api/...` on the same origin)
4. In `frontend/src/lib/api.js` the base is `${REACT_APP_BACKEND_URL}/api` — if you deploy everything on one Vercel domain, set `REACT_APP_BACKEND_URL=""` so requests go to `/api/...` on the same origin.
5. Serverless caveats to know:
   - Cold starts are ~1–2s on first hit.
   - `mongoose.connect` is cached inside `backend/api/index.js` via `cachedConn`.
   - The 30s function timeout is set in the config (`maxDuration: 30`).
   - No persistent WebSocket / cron jobs — use Vercel Cron for the fee-reminder endpoint if needed.

---

## Post-deploy sanity checks

```bash
# 1. Backend health
curl https://<backend-url>/api/health
# {"status":"ok",...}

# 2. Login as principal
curl -X POST https://<backend-url>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"principal","password":"Principal@123"}'

# 3. Frontend
open https://<frontend-url>/
```

## Seeding demo data in production

```bash
# From a shell attached to the backend (Render Shell, Railway CLI, or a one-off Vercel function)
node seed.js
```

Seed script is **idempotent** — safe to re-run.
