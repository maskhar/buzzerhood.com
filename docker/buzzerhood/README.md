# BUZZERHOOD PRODUCTION DEPLOYMENT

This directory contains the complete production Docker setup for Buzzerhood.

## Architecture

`
dev-buzzerhood.carubra.com (web frontend)
    ↓
api.dev-buzzerhood.carubra.com (backend API)
    ↓
buzzerhood-postgres (PostgreSQL)
`

## Services

### buzzerhood-postgres
- PostgreSQL 17 Alpine
- Database: buzzerhood
- Internal port: 5432 (NOT exposed publicly)
- Persistent volume: postgres_data
- Runtime role: buzzerhood_app (non-superuser)

### buzzerhood-api
- NestJS Backend (Node 24)
- Internal port: 3100
- Exposed: 127.0.0.1:3100 (local only, reverse proxy required)
- Image: buzzerhood-api:b4
- Non-root user (10001:10001)

### buzzerhood-web
- React/Vite Frontend (nginx 1.27 Alpine)
- Internal port: 80
- Exposed: 127.0.0.1:8080 (local only, reverse proxy required)
- Image: buzzerhood-web:b4
- Static assets with optimized caching

## Prerequisites

### 1. Secrets Directory

Create secrets directory:
```bash
mkdir -p docker/buzzerhood/secrets
chmod 700 docker/buzzerhood/secrets
```

### 2. PostgreSQL Password

```bash
openssl rand -base64 32 > docker/buzzerhood/secrets/postgres_password.txt
chmod 600 docker/buzzerhood/secrets/postgres_password.txt
```

### 3. JWT Keys

Generate Ed25519 key pair for JWT signing:

```bash
# Private key
openssl genpkey -algorithm ED25519 -out docker/buzzerhood/secrets/jwt-private.pem
chmod 600 docker/buzzerhood/secrets/jwt-private.pem

# Public key
openssl pkey -in docker/buzzerhood/secrets/jwt-private.pem -pubout -out docker/buzzerhood/secrets/jwt-public.pem
chmod 644 docker/buzzerhood/secrets/jwt-public.pem
```

### 4. API Environment

```bash
cp docker/buzzerhood/.env.api.example docker/buzzerhood/.env.api
```

Edit .env.api and replace:
- REPLACE_WITH_APP_PASSWORD with a strong password for buzzerhood_app role

### 5. Frontend Environment (Build-time)

Create .env.production in repository root:

```
VITE_API_BASE_URL=https://api.dev-buzzerhood.carubra.com/api/v1
```

DO NOT include VITE_SUPABASE_* variables in production.

## Database Setup

### 1. Create buzzerhood_app Role

After postgres container starts, create the application role:

```bash
docker exec -it buzzerhood-postgres psql -U postgres -d buzzerhood -c "CREATE ROLE buzzerhood_app WITH LOGIN PASSWORD 'YOUR_APP_PASSWORD' NOCREATEDB NOCREATEROLE NOREPLICATION; GRANT USAGE ON SCHEMA buzzerhood TO buzzerhood_app;"
```

### 2. Apply Migrations

Run migrations 0001-0018 from the database/migrations directory.

### 3. Grant Runtime Permissions

```bash
docker exec -it buzzerhood-postgres psql -U postgres -d buzzerhood -c "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA buzzerhood TO buzzerhood_app; GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA buzzerhood TO buzzerhood_app; GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA buzzerhood TO buzzerhood_app; ALTER DEFAULT PRIVILEGES IN SCHEMA buzzerhood GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO buzzerhood_app; ALTER DEFAULT PRIVILEGES IN SCHEMA buzzerhood GRANT USAGE, SELECT ON SEQUENCES TO buzzerhood_app; ALTER DEFAULT PRIVILEGES IN SCHEMA buzzerhood GRANT EXECUTE ON FUNCTIONS TO buzzerhood_app;"
```

## Build and Deploy

### Build Images

```bash
cd docker/buzzerhood
docker compose build
```

### Start Services

```bash
docker compose up -d
```

### Check Status

```bash
docker compose ps
docker compose logs -f
```

### Verify Health

```bash
# PostgreSQL
docker exec buzzerhood-postgres pg_isready -U postgres -d buzzerhood

# Backend API
curl http://127.0.0.1:3100/health
curl http://127.0.0.1:3100/ready
curl http://127.0.0.1:3100/api/v1/network

# Frontend
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/
```

## Reverse Proxy Configuration

The containers bind to localhost only. Configure your reverse proxy for HTTPS termination.

## Data Migration from Supabase

See separate migration script for copying Partner data from existing Supabase PostgreSQL.

## Maintenance

### View Logs

```bash
docker compose logs -f [service_name]
```

### Restart Service

```bash
docker compose restart [service_name]
```

### Stop All Services

```bash
docker compose down
```

### Backup Database

```bash
docker exec buzzerhood-postgres pg_dump -U postgres -Fc buzzerhood > backup.dump
```

## Security Notes

1. PostgreSQL is NOT exposed publicly
2. API and Web bind to 127.0.0.1 only
3. All services run with security hardening
4. Secrets are file-based, not in Git
5. Registration is closed by default
6. CORS is restricted to production domains

## Production Checklist

- [ ] Secrets generated and secured
- [ ] .env.api configured with production values
- [ ] .env.production created with API URL
- [ ] Database migrations applied (0001-0018)
- [ ] buzzerhood_app role created and granted
- [ ] Images built successfully
- [ ] All containers healthy
- [ ] Reverse proxy configured with TLS
- [ ] DNS pointing to server
- [ ] Health endpoints responding
- [ ] /api/v1/network returns data
- [ ] CORS configured correctly
- [ ] Backup strategy in place
