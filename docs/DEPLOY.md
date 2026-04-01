# Deployment Guide

## Prerequisites
- Python 3.9+
- Installed dependencies from `requirements.txt`
- Trained model artifacts in `/model`
  - `pcos_model.pkl`
  - `scaler.pkl`
  - `features.pkl`
  - `metrics.json`
  - `metadata.json`

## Local Run
```bash
python app/backend/app.py
```

## Production (Gunicorn)
```bash
cd app/backend
gunicorn -w 2 -b 0.0.0.0:5000 app:app
```

## Recommended Checks Before Deploy
```bash
python -m flake8 .
python -m pytest
```

---

## Deploying the Flask Backend

The Flask backend (Python) cannot run on Vercel. Use one of these platforms:

### Option 1 — Railway (recommended, free tier)
1. Push this repo to GitHub.
2. Go to [railway.app](https://railway.app) and create a new project from your GitHub repo.
3. Railway auto-detects Python; set the **Start Command**:
   ```
   gunicorn -w 2 -b 0.0.0.0:$PORT app.backend.app:app
   ```
4. Add the environment variable `CORS_ORIGINS` set to your Vercel frontend URL
   (e.g. `https://pcos-frontend.vercel.app`).
5. Note the public URL Railway assigns (e.g. `https://pcos-xxx.up.railway.app`).

### Option 2 — Render (free tier, cold starts apply)
1. Go to [render.com](https://render.com) → New → Web Service → connect your repo.
2. Set **Build Command**: `pip install -r requirements.txt`
3. Set **Start Command**: `gunicorn -w 2 -b 0.0.0.0:$PORT app.backend.app:app`
4. Add the env var `CORS_ORIGINS` = your Vercel frontend URL.

---

## Deploying the Next.js Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → import your GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Add the environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://<your-railway-or-render-url>
   ```
4. Click Deploy. Vercel handles the Next.js build automatically.

The frontend calls `NEXT_PUBLIC_API_URL/predict` for predictions.

