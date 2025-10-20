
# BudgieHero Web (Angular)

Genereer de Angular app:

```bash
npm create @angular@latest . -- --standalone --routing --style=scss --skip-git
```

Tijdens CI wordt `assets/config.json` gegenereerd via `scripts/inject-config.sh` o.b.v. `API_URL` secrets per omgeving.
