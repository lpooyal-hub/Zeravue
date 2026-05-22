# Planetarium

`Open a scene, breathe, stay for a while.`

Planetarium is a healing-focused night-sky experience built with React, Three.js, and FastAPI.  
It is not meant to feel like an observatory dashboard or a study tool first. The goal is to let someone open the sky, settle into a mood, and spend a quiet minute with it.

The current release centers on one theme: the night sky.

## Live Demo

Current deployed build:

- `http://168.107.51.224:8001`

Local development:

- Frontend viewer: `http://localhost:5173`
- Backend API health: `http://localhost:8000/api/health`

## What It Does

The project currently supports two connected experiences:

1. Night-sky viewing
   - space drift view
   - observer view
   - dome projection view
   - constellation focus, search, tracking, and favorites
   - location-aware sky generation from the backend

2. Night-sky sketching
   - import finished constellations into a custom scene
   - duplicate, move, rotate, spread, and scale constellations
   - drag individual stars
   - save and pin custom sketch layouts

The result is somewhere between a gentle screensaver, a constellation viewer, and a personal sky canvas.

## Why It Exists

This project is the first theme in a broader healing panorama direction.

The longer-term vision is one site with multiple quiet scene themes inside it, such as:

- aurora skies
- underwater drift
- rainy forest scenes
- cloud panoramas

The night-sky theme is the reference experience that future themes will build on.

## Stack

- Frontend: React + Vite
- 3D rendering: `@react-three/fiber` / Three.js
- Backend: FastAPI
- Data pipeline: Python astronomy services and HYG-based star scene generation
- Deployment: Docker Compose + GitHub Actions + Oracle server hosting

## Project Structure

```text
backend/
  app/
    main.py
    routers/
    services/
src/
  App.jsx
  api/
  components/
  data/
  hooks/
  styles.css
public/
scripts/
```

## Running Locally

Frontend:

```bash
npm install
npm run dev
```

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Docker

Run the frontend and backend together:

```bash
docker compose up --build
```

App URL:

- `http://localhost:5173`

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

## Deployment Flow

This repository uses a simple GitHub Actions flow:

- push to `dev`: validate the Docker app
- push to `main`: validate, then deploy to the Oracle server over SSH

Key files:

- [.github/workflows/ci-cd.yml](./.github/workflows/ci-cd.yml)
- [scripts/deploy.sh](./scripts/deploy.sh)

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
2. Push `dev`
3. Let validation pass
4. Merge `dev` into `main`
5. Push `main`
6. Let GitHub Actions deploy the latest build

## Current Focus

The project has moved beyond early prototype stage and is now in the “raise the finish quality” phase.

Current priorities:

- reduce remaining UI clutter
- keep splitting oversized frontend files into clearer components and hooks
- make the night-sky theme feel more restful and polished
- prepare the project structure for future theme expansion

## Notes

- The sky scene is intended as an emotionally readable observing guide, not a precision astronomy simulator.
- Ambient audio is being transitioned toward theme-based loop tracks.
- Panorama view is currently hidden from the main UI while the core viewing modes are being tightened.

## Related Docs

- [docs/PROJECT_VISION.md](./docs/PROJECT_VISION.md)
- [docs/THEMES.md](./docs/THEMES.md)
- [docs/STAR_THEME_ROADMAP.md](./docs/STAR_THEME_ROADMAP.md)
