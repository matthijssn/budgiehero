
# BudgieHero (MEAN) — OT(A)P Scaffold

Persoonlijk kasboek/boekhouding met een **OT(A)P** straat:
- **O** (Ontwikkel): lokaal met Docker Compose
- **T** (Test): cloud (Render + Vercel) — automatische deploy vanaf `develop`
- **P** (Productie): cloud (Render + Vercel) — beschermde deploy vanaf `main`

## TL;DR
```bash
# Lokaal (O)
nvm use
npm ci --workspaces
docker compose -f docker-compose.yml -f docker-compose.o.yml --env-file env/o/api.env up -d
# (optioneel) Angular genereren in apps/web en starten op :4200

# Deploy T: push naar 'develop'
# Deploy P: push naar 'main' (met GitHub Environment protection)
```

Zie `DEPLOY.md` voor de volledige set-up in Render, Vercel en Atlas.
