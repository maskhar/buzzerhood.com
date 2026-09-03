#!/usr/bin/env bash
set -euo pipefail

ACTION="${1:-start}"
API_URL="${API_URL:-http://localhost:3100}"
WEB_URL="${WEB_URL:-http://localhost:8080}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DEPLOY_DIR="$ROOT/docker/buzzerhood"
SECRETS_DIR="$DEPLOY_DIR/secrets"

mkdir -p "$SECRETS_DIR" "$ROOT/.docker-data/postgres"
cd "$DEPLOY_DIR"

random_hex() {
  if command -v openssl >/dev/null 2>&1; then openssl rand -hex "$1"; else node -e "console.log(require('node:crypto').randomBytes($1).toString('hex'))"; fi
}

jwt() {
  if command -v openssl >/dev/null 2>&1; then
    openssl genpkey -algorithm ED25519 -out secrets/jwt-private.pem
    openssl pkey -in secrets/jwt-private.pem -pubout -out secrets/jwt-public.pem
  elif command -v node >/dev/null 2>&1; then
    node -e "const{generateKeyPairSync}=require('node:crypto');const{writeFileSync}=require('node:fs');const k=generateKeyPairSync('ed25519');writeFileSync('secrets/jwt-private.pem',k.privateKey.export({type:'pkcs8',format:'pem'}));writeFileSync('secrets/jwt-public.pem',k.publicKey.export({type:'spki',format:'pem'}));"
  else
    echo 'OpenSSL atau Node.js diperlukan untuk JWT Ed25519 keys.' >&2
    exit 1
  fi
}

env_files() {
  [[ -f secrets/postgres_password.txt ]] || random_hex 24 > secrets/postgres_password.txt
  [[ -f secrets/jwt-private.pem && -f secrets/jwt-public.pem ]] || jwt
  local db_pass key_id
  db_pass="$(cat secrets/postgres_password.txt)"
  key_id="buzzerhood-$(date +%Y%m%d%H%M%S)"
  printf 'VITE_API_BASE_URL=%s/api/v1\n' "${API_URL%/}" > "$ROOT/.env.production"
  cat > .env.api <<EOF
NODE_ENV=production
HOST=0.0.0.0
PORT=3100
DATABASE_URL=postgresql://buzzerhood_app:$db_pass@postgres:5432/buzzerhood
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_CONNECTION_TIMEOUT_MS=5000
DATABASE_QUERY_TIMEOUT_MS=10000
JWT_ISSUER=${API_URL%/}
JWT_AUDIENCE=buzzerhood-web
JWT_ACCESS_TTL_SECONDS=600
JWT_PRIVATE_KEY_PATH=/run/secrets/buzzerhood-jwt-private.pem
JWT_PUBLIC_KEY_PATH=/run/secrets/buzzerhood-jwt-public.pem
JWT_KEY_ID=$key_id
REFRESH_TOKEN_TTL_SECONDS=2592000
REFRESH_COOKIE_NAME=buzzerhood_refresh
CSRF_COOKIE_NAME=buzzerhood_csrf
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
CORS_ORIGINS=${WEB_URL%/}
AUTH_REGISTRATION_MODE=closed
AUTH_RATE_LIMIT_TTL_MS=60000
AUTH_RATE_LIMIT_MAX=10
SWAGGER_ENABLED=false
LOG_LEVEL=info
EOF
}

migrate() {
  docker compose up -d postgres
  sleep 8
  local db_pass
  db_pass="$(cat secrets/postgres_password.txt)"
  docker exec buzzerhood-postgres psql -U postgres -d buzzerhood -v ON_ERROR_STOP=1 -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'buzzerhood_app') THEN CREATE ROLE buzzerhood_app WITH LOGIN PASSWORD '$db_pass' NOCREATEDB NOCREATEROLE NOREPLICATION; END IF; END \$\$;"
  for file in "$ROOT"/database/migrations/*.sql; do
    echo "[MIGRATE] $(basename "$file")"
    docker exec -i buzzerhood-postgres psql -U postgres -d buzzerhood -v ON_ERROR_STOP=1 < "$file"
  done
  docker exec -i buzzerhood-postgres psql -U postgres -d buzzerhood -v ON_ERROR_STOP=1 -v "app_password=$db_pass" < "$ROOT/database/operations/create_buzzerhood_app_role.sql"
}

case "$ACTION" in
  env) env_files ;;
  jwt) jwt ;;
  start) env_files; docker compose up -d --build; docker compose ps ;;
  restart) docker compose restart; docker compose ps ;;
  stop) docker compose down ;;
  status) docker compose ps ;;
  logs) docker compose logs -f ;;
  migrate) migrate ;;
  import-sql)
    [[ -n "${2:-}" ]] || { echo "usage: $0 import-sql file.sql|file.dump" >&2; exit 1; }
    if [[ "$2" == *.dump ]]; then
      docker cp "$2" buzzerhood-postgres:/tmp/import.dump
      docker exec buzzerhood-postgres pg_restore -U postgres -d buzzerhood --clean --if-exists --no-owner --no-privileges /tmp/import.dump
    else
      docker exec -i buzzerhood-postgres psql -U postgres -d buzzerhood -v ON_ERROR_STOP=1 < "$2"
    fi
    ;;
  *) echo 'actions: env jwt start restart stop status logs migrate import-sql'; exit 1 ;;
esac
