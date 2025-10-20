
#!/usr/bin/env bash
set -euo pipefail
API_URL=${1:-}
if [ -z "$API_URL" ]; then
  echo "API_URL not provided" >&2
  exit 1
fi
mkdir -p apps/web/src/assets
cat > apps/web/src/assets/config.json <<JSON
{ "API_URL": "${API_URL}" }
JSON
echo "Wrote apps/web/src/assets/config.json with API_URL=${API_URL}"
