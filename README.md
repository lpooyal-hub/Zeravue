# Zeravue

`Open a scene, breathe, stay for a while.`

Zeravue is an ambient digital themes platform.  
It is designed as a quiet immersive space first, not a dashboard-style app.

Current active themes:
- Night Sky
- Aurora Night
- Monsoon Canopy (`깊은 숲의 비`)

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

Night Sky is the reference interaction surface.  
Aurora and Monsoon Canopy follow the same ambient viewing philosophy with lighter, theme-specific scene layers.

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

4. Monsoon Canopy theme
- rainforest image-based backdrop with canvas rain
- local rain/thunder audio samples
- minimal mood controls focused on intensity, flow, and distant thunder

5. Analytics/Admin
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
  data/
  app/
    routers/
    services/
docs/
  devlog/
public/
  audio/
  branding/
src/
  api/
  astro/
  audio/
  components/
    canvas/
    experiences/
  context/
  data/
    themes/
  hooks/
  lib/
  scene/
  utils/
scripts/
docker-compose.dev.yml
docker-compose.prod.yml
```

## Theme Structure Notes

- `src/data/themes/`
  - theme metadata, display copy, route ids, and ambient defaults
- `src/components/experiences/`
  - theme-specific top-level experience surfaces
- `src/hooks/`
  - per-theme interaction/audio hooks (`useRainThunder`, `useNightSkyExperience`, etc.)
- `src/audio/`
  - generated or processed ambient helpers
- `public/audio/`
  - local loop/sample assets for themes that should not depend on generated audio alone

When a new theme is added, update this README structure section in the same change so the current code layout stays easy to follow.

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

# Prod stack (zeravue.xyz target, static build + nginx)
docker compose -f docker-compose.prod.yml up -d
```

Notes:
- `Dockerfile`: development frontend container (Vite dev server)
- `Dockerfile.prod`: production frontend image (`npm run build` + `nginx` static serving)
- `nginx.prod.conf`: SPA fallback routing for production

## Environment

Frontend `.env`:

```text
VITE_API_BASE_URL=
VITE_AMBIENT_TRACK_URL=
VITE_AURORA_AMBIENT_TRACK_URL=
VITE_RAIN_AMBIENT_TRACK_URL=
VITE_PROXY_TARGET=http://backend:8000
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ADSENSE_CLIENT=
VITE_ADSENSE_HOME_SLOT=
```

Backend `backend/.env`:

```text
FRONTEND_ORIGIN=http://127.0.0.1:5173
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_DASHBOARD_KEY=
```

## Branch and Deploy Flow

- `dev`: active development and validation
- `main`: release branch, triggers production deployment

GitHub Actions:
- validate on `dev`
- validate + deploy on `main`

## Production Notes

- Main domain: `zeravue.xyz`
- Dev domain: `dev.zeravue.xyz`
- Vite `allowedHosts` includes both domains and localhost entries.
- Admin analytics currently aggregates Supabase REST data in backend logic; when volume grows, migrate aggregation to Supabase view/RPC for better scalability.

## Related Docs

- [docs/GOALS.md](./docs/GOALS.md)
- [docs/PROJECT_VISION.md](./docs/PROJECT_VISION.md)
- [docs/THEMES.md](./docs/THEMES.md)
- [docs/STAR_THEME_ROADMAP.md](./docs/STAR_THEME_ROADMAP.md)
- [docs/BRAND.md](./docs/BRAND.md)
