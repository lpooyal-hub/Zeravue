# Celestial Atlas Planetarium

React frontend + Python FastAPI backend portfolio project for an interactive planetarium.

## Features

- React-based multilingual UI: English and Korean
- Animated canvas planetarium with planets, stars, zodiac lines, and shooting stars
- NASA APOD API through the Python backend
- Real NASA planet imagery in the planet cards and tracking panel
- Browser geolocation plus backend visibility calculation for zodiac constellations
- Client-side fallback if the backend is temporarily unavailable

## Structure

```text
backend/
  app/
    main.py
    routers/
      apod.py
      sky.py
    services/
      observability.py
src/
  App.jsx
  main.jsx
  api/
  astro/
  data/
  scene/
  styles.css
```

## Frontend

```bash
npm install
npm run dev
```

Frontend URL:

```text
http://127.0.0.1:5173
```

## Docker

Run the frontend and backend together:

```bash
docker compose up --build
```

App URL:

```text
http://localhost:5173
```

API health check:

```text
http://localhost:8000/api/health
```

Production-style server access in the current Oracle setup:

```text
http://168.107.51.224:8001
```

## Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend health check:

```text
http://127.0.0.1:8000/api/health
```

## Environment

Frontend `.env`:

```text
VITE_API_BASE_URL=
VITE_NASA_API_KEY=DEMO_KEY
```

Backend `backend/.env`:

```text
NASA_API_KEY=DEMO_KEY
NASA_BASE_URL=https://api.nasa.gov
FRONTEND_ORIGIN=http://127.0.0.1:5173
```

When running with Vite, `/api` is proxied to `http://127.0.0.1:8000`.

## CI/CD

This repository is set up for a GitHub Actions flow with direct server hosting:

- `dev` push: build and validate the Docker app
- `main` push: build, validate, then deploy to the Oracle server over SSH

The workflow file lives at [.github/workflows/ci-cd.yml](./.github/workflows/ci-cd.yml) and uses [scripts/deploy.sh](./scripts/deploy.sh) on the server.

Required GitHub repository secrets:

```text
DEPLOY_HOST=168.107.51.224
DEPLOY_PATH=/home/ubuntu/Planetarium
DEPLOY_PORT=22
DEPLOY_SSH_KEY=<private key contents>
DEPLOY_USER=ubuntu
```

Recommended release flow:

1. Work on `dev`
2. Push `dev` and let the validation job pass
3. Merge `dev` into `main`
4. Push `main`
5. GitHub Actions connects to the Oracle server and runs `./scripts/deploy.sh main`

If you continue editing directly on the server, it is safer to keep a separate production checkout path such as `/home/ubuntu/Planetarium-main` for automatic deployments. The deploy script intentionally uses `git pull --ff-only` so it fails instead of overwriting uncommitted server-side changes.

## Notes

The current location-based sky feature estimates visible zodiac constellations from latitude, longitude, local sidereal time, and approximate constellation center coordinates. It is meant as a portfolio-grade observing guide, not a precision ephemeris.

NASA sources:

- https://api.nasa.gov
- https://science.nasa.gov/solar-system/planets/
