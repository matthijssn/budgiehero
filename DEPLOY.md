
# Deploy handleiding — BudgieHero OT(A)P

Deze scaffold is ingericht voor een OT(A)P-straat:

- **O**: Lokaal via Docker Compose. MongoDB + Redis + API + Worker — Angular lokaal.
- **T**: Cloud testomgeving via **Render** (API/Worker/Redis) en **Vercel** (web). GitHub Actions triggert deploy op elke push naar `develop`.
- **P**: Cloud productie via Render en Vercel. GitHub Actions op push naar `main` met **Environment protection**.

## 1) Voorbereiding

### MongoDB Atlas (T & P)
- Maak 2 databases of 2 clusters aan: `budgiehero_t` en `budgiehero_p` (of afzonderlijke clusters).
- Noteer de connection strings en plaats ze als secrets: `MONGODB_URI_T` en `MONGODB_URI_P` in GitHub en Render.

### Render
- Maak **2 Blueprint projecten** aan op basis van de bestanden:
  - Test: `render.test.yaml`
  - Prod: `render.prod.yaml`
- Voor elk project maak je **Deploy Hooks** aan voor API en Worker (Render → Service → Settings → Deploy Hook) en zet je de URLs als GitHub Secrets:
  - Test: `RENDER_TEST_API_HOOK`, `RENDER_TEST_WORKER_HOOK`
  - Prod: `RENDER_PROD_API_HOOK`, `RENDER_PROD_WORKER_HOOK`
- Vul in de Render–Environment Variables:
  - Test: `MONGODB_URI = <MONGODB_URI_T>`, `FRONTEND_ORIGIN = <T-web-URL>` + Google OAuth secrets
  - Prod: `MONGODB_URI = <MONGODB_URI_P>`, `FRONTEND_ORIGIN = <P-web-URL>` + Google OAuth secrets

### Vercel
- Maak **2 projecten** aan voor `apps/web`:
  - `budgiehero-web-test` (T) en `budgiehero-web-prod` (P)
- Maak een **token** aan en sla op in GitHub Secrets: `VERCEL_TOKEN`.
- Zet **ORG** en **PROJECT ID** secrets:
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID_TEST`
  - `VERCEL_PROJECT_ID_PROD`
- Configureer in Vercel per project een env var `API_URL`:
  - Test → `https://budgiehero-api-test.onrender.com`
  - Prod → `https://budgiehero-api-prod.onrender.com`

## 2) Branch strategie
- `develop` → **T** (auto-deploy)
- `main` → **P** (manual/Protected deploy via GitHub Environments)

## 3) Pipelines
- `.github/workflows/deploy-test.yml`
- `.github/workflows/deploy-prod.yml`

Beide workflows:
- Build & lint
- Web deploy naar Vercel (aparte project IDs)
- API/Worker deploy via Render Deploy Hooks

## 4) Runtime config web
- `apps/web/scripts/inject-config.sh` schrijft `assets/config.json` op basis van `API_URL`.
- Vercel workflows roepen dit script aan vóór de build.

## 5) Secrets (overzicht)
GitHub → Settings → Secrets → Actions:
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_TEST`, `VERCEL_PROJECT_ID_PROD`
- `RENDER_TEST_API_HOOK`, `RENDER_TEST_WORKER_HOOK`
- `RENDER_PROD_API_HOOK`, `RENDER_PROD_WORKER_HOOK`
- (optioneel) `GOOGLE_CLIENT_ID_T/P`, `GOOGLE_CLIENT_SECRET_T/P`

Render (per environment):
- `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_ORIGIN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OIDC_REDIRECT_URI`

Vercel (per project):
- `API_URL`

## 6) Lokaal (O)
```bash
nvm use
npm ci --workspaces
# Start O: compose voor O + .env met O-waarden
docker compose -f docker-compose.yml -f docker-compose.o.yml --env-file env/o/api.env up -d
# Angular in een lokale shell:
# npm create @angular@latest apps/web -- --standalone --routing --style=scss --skip-git
# echo '{ "API_URL": "http://localhost:3000" }' > apps/web/src/assets/config.json
# (cd apps/web && npm i && npm start)
```

## 7) Promote naar productie
- Open een PR van `develop` → `main`
- Na merge triggert `deploy-prod.yml` (met Environment protection)
