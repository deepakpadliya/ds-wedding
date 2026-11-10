# Deepak ❤ Shruti Wedding Website

One Node.js app: **Express** serves the API and the **React** site (built with **Vite**), backed by **MongoDB**.

```text
server/     Express API (routes, auth, validation, db)
src/        React frontend
public/     Static files (images, favicon)
index.html  Vite entry
memory/     PRD.md (project spec)
```

## Prerequisites

- Node.js 20+
- MongoDB on `localhost:27017`

```bash
brew tap mongodb/brew && brew trust mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

## Setup

```bash
npm install
cp .env.example .env     # then edit JWT_SECRET and ADMIN_PASSWORD
```

## Run

| Command | What it does |
| --- | --- |
| `npm run dev` | Development: API + Vite hot reload, one process on http://localhost:3000 |
| `npm run build` | Build the frontend into `dist/` |
| `npm start` | Production: serves `dist/` and the API on `PORT` (run `npm run build` first) |

Site: http://localhost:3000. Admin: http://localhost:3000/admin
(login with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`; the admin is created on first start).
Health check: `curl localhost:3000/api/health`

## Environment (`.env`)

| Variable | Notes |
| --- | --- |
| `MONGO_URL`, `DB_NAME` | MongoDB connection |
| `JWT_SECRET` | Use a long random string |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Seeded admin user |
| `PORT` | Default 3000 |
| `COOKIE_SECURE` | `true` when served over https |

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `Missing required env var` | Create `.env` from `.env.example` |
| Health says `database: unavailable` | `brew services start mongodb-community` |
| `npm install` peer-dependency errors | `.npmrc` already sets `legacy-peer-deps=true` |
| Port in use | `lsof -i :3000`, then kill the process |

## Notes

- Images in `public/images` are about 2 MB each. Compressing them will speed up the first load.

## Deploy to Vercel

The site is served from Vercel's CDN and the API runs as one serverless function (`api/index.js` → `server/app.js`). Config is in `vercel.json`.

1. **MongoDB Atlas:** create a cluster (or reuse one, with a new database name such as `wedding`). Under Network Access allow `0.0.0.0/0`, since Vercel has no fixed IPs.
2. **Install and link** (use a *new* project, not another app's):
   ```bash
   npm i -g vercel
   vercel login
   vercel link          # create a new project, e.g. "deepak-shruti-wedding"
   ```
3. **Set environment variables** for Production:
   ```bash
   vercel env add MONGO_URL production        # mongodb+srv://user:pass@cluster/...
   vercel env add DB_NAME production          # wedding
   vercel env add JWT_SECRET production       # openssl rand -hex 32
   vercel env add ADMIN_EMAIL production
   vercel env add ADMIN_PASSWORD production   # a strong password
   vercel env add COOKIE_SECURE production    # true
   ```
4. **Deploy:** `vercel --prod`

The admin user is created on the first API request. Notes: the RSVP/login rate limiter is in-memory and per serverless instance, so treat it as best-effort. Never commit `.env`.
