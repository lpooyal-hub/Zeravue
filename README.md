# Zeravue

`Open a scene, breathe, stay for a while.`

Zeravue is an ambient digital themes platform.  
It is designed as a quiet immersive space first, not a dashboard-style app.

Current active themes:
- Night Sky
- Aurora Night

Upcoming theme direction:
- underwater
- rainy forest
- cloud and horizon scenes

## Product Direction

Zeravue focuses on:
- atmosphere before functionality
- immersion before information
- subtle motion before flashy effects
- calm viewing flow across desktop and mobile

Night Sky is the reference theme architecture.  
Aurora is being developed to follow the same ambient viewing philosophy.

## Core Features

1. Immersive ambient viewer
- fullscreen-first viewing flow
- hidden/minimal controls during appreciation
- ambient audio playback with theme-specific tracks

2. Night Sky interactions
- observer and space-oriented sky views
- constellation focus, search, tracking, favorites
- night-sky sketch workspace with saveable layouts
- backend-driven sky scene data

3. Aurora theme
- panorama-based calm scene
- layered atmospheric effects
- lightweight rendering path for broader device support

4. Analytics/Admin
- anonymous visitor/session analytics
- Supabase-backed metrics with local fallback mode

## Tech Stack

- Frontend: React + Vite
- 3D/scene rendering: Three.js / React Three Fiber (theme-dependent)
- Backend: FastAPI
- Data: HYG-based sky generation + analytics events
- Infra: Docker Compose + Nginx reverse proxy + GitHub Actions + Oracle server

## Repository Layout

```text
backend/
  app/
docs/
public/
src/
  api/
  components/
  context/
  data/
    themes/
  hooks/
  lib/
  utils/
scripts/
docker-compose.dev.yml
docker-compose.prod.yml
```

## Naming and Directory Convention

This project is now branded as **Zeravue**.

- GitHub repository should use a Zeravue-aligned name.
- Local working directory is recommended as `zeravue` (or `Zeravue`) instead of `Planetarium`.

Current server directory example:

```bash
cd Zeravue
```

If you rename the folder, update any absolute paths used by deploy scripts, CI secrets, or shell aliases.

## Local Run

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
uvicorn app.main:app --reload
```

## Docker Run

Default:

```bash
docker compose up --build
```

Separated stacks:

```bash
# Dev stack (dev.zeravue.xyz target)
docker compose -f docker-compose.dev.yml up -d

# Prod stack (zeravue.xyz target)
docker compose -f docker-compose.prod.yml up -d
```

## Environment

Frontend `.env`:

```text
VITE_API_BASE_URL=
VITE_NASA_API_KEY=DEMO_KEY
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Backend `backend/.env`:

```text
NASA_API_KEY=DEMO_KEY
NASA_BASE_URL=https://api.nasa.gov
FRONTEND_ORIGIN=
```

## Branch and Deploy Flow

- `dev`: active development and validation
- `main`: release branch, triggers production deployment

GitHub Actions:
- validate on `dev`
- validate + deploy on `main`

## Related Docs

- [docs/GOALS.md](./docs/GOALS.md)
- [docs/PROJECT_VISION.md](./docs/PROJECT_VISION.md)
- [docs/THEMES.md](./docs/THEMES.md)
- [docs/STAR_THEME_ROADMAP.md](./docs/STAR_THEME_ROADMAP.md)
- [docs/BRAND.md](./docs/BRAND.md)
