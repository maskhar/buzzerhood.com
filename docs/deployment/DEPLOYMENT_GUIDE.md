# BUZZERHOOD PRODUCTION LAUNCH GUIDE

## Overview

This guide walks through the complete production deployment of Buzzerhood with:
- Dedicated PostgreSQL 17 database
- Independent NestJS Backend API
- React/Vite Frontend
- No Supabase runtime dependency

## Prerequisites on Production Server

- Docker and Docker Compose installed
- SSH access: maskhar@20.20.20.173
- Git repository cloned to: /home/maskhar/buzzerhood
- Reverse proxy configured (nginx/caddy)
- DNS records for dev-buzzerhood.carubra.com and api.dev-buzzerhood.carubra.com
- SSL certificates ready

## Deployment Steps

### 1. Upload Repository to Server

From Windows development machine:

```powershell
# Sync repository to server (excluding node_modules, dist)
scp -r I:\website-devops\dev-buzzerhood.carubra.com maskhar@20.20.20.173:/home/maskhar/
```

Or use Git:

```bash
ssh maskhar@20.20.20.173
cd /home/maskhar
git clone <repository-url> buzzerhood
cd buzzerhood
```

### 2. Run Deployment Script

```bash
ssh maskhar@20.20.20.173
cd /home/maskhar/buzzerhood
chmod +x docker/buzzerhood/deploy-production.sh
./docker/buzzerhood/deploy-production.sh
```

The script will:
- Create /home/maskhar/docker/buzzerhood deployment directory
- Generate secrets (PostgreSQL password, JWT keys)
- Create .env.api from template
- Build Docker images
- Start PostgreSQL and apply migrations
- Migrate data from Supabase
- Start Backend API and Frontend
- Verify health checks

### 3. Manual Configuration

After script completes, review and update:

```bash
cd /home/maskhar/docker/buzzerhood
nano .env.api
```

Verify:
- DATABASE_URL has correct buzzerhood_app password
- JWT_ISSUER and JWT_AUDIENCE match production domains
- CORS_ORIGINS includes https://dev-buzzerhood.carubra.com,https://dev-buzzerhood.carubra.com
- COOKIE_SECURE=true
- COOKIE_SAME_SITE=strict

### 4. Configure Reverse Proxy

Example nginx configuration:

```nginx
# Frontend - dev-buzzerhood.carubra.com
server {
    listen 443 ssl http2;
    server_name dev-buzzerhood.carubra.com www.dev-buzzerhood.carubra.com;
    
    ssl_certificate /path/to/dev-buzzerhood.carubra.com.crt;
    ssl_certificate_key /path/to/dev-buzzerhood.carubra.com.key;
    
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API - api.dev-buzzerhood.carubra.com
server {
    listen 443 ssl http2;
    server_name api.dev-buzzerhood.carubra.com;
    
    ssl_certificate /path/to/api.dev-buzzerhood.carubra.com.crt;
    ssl_certificate_key /path/to/api.dev-buzzerhood.carubra.com.key;
    
    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS preflight
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin $http_origin always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
            add_header Access-Control-Allow-Credentials true always;
            return 204;
        }
    }
}
```

Reload nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Verify Production Endpoints

```bash
# From server
curl -f https://dev-buzzerhood.carubra.com/
curl -f https://api.dev-buzzerhood.carubra.com/health
curl -f https://api.dev-buzzerhood.carubra.com/ready
curl -f https://api.dev-buzzerhood.carubra.com/api/v1/network

# From external browser
# Visit https://dev-buzzerhood.carubra.com
# Open DevTools Network tab and verify API calls go to api.dev-buzzerhood.carubra.com
```

### 6. Monitor Services

```bash
cd /home/maskhar/docker/buzzerhood

# View all logs
docker compose logs -f

# View specific service
docker compose logs -f api
docker compose logs -f web
docker compose logs -f postgres

# Check status
docker compose ps

# Check resource usage
docker stats
```

### 7. Data Migration Verification

```bash
# Connect to dedicated PostgreSQL
docker exec -it buzzerhood-postgres psql -U postgres -d buzzerhood

# Verify counts
SELECT 
  'partners' as table_name, COUNT(*) as count FROM buzzerhood.partners
UNION ALL
SELECT 'partner_legacy_imports', COUNT(*) FROM buzzerhood.partner_legacy_imports
UNION ALL
SELECT 'partner_platform_accounts', COUNT(*) FROM buzzerhood.partner_platform_accounts
UNION ALL
SELECT 'partner_metric_snapshots', COUNT(*) FROM buzzerhood.partner_metric_snapshots;

# Verify public network view
SELECT COUNT(*) FROM buzzerhood.public_network_partners;

# Exit
\q
```

Expected counts (approximate):
- partners: 124
- partner_legacy_imports: 124
- partner_platform_accounts: 206
- partner_metric_snapshots: 124

## Rollback Plan

If issues occur:

### Option 1: Restart Services

```bash
cd /home/maskhar/docker/buzzerhood
docker compose restart api web
```

### Option 2: Roll Back to Previous Image

```bash
docker compose down
docker tag buzzerhood-api:b3 buzzerhood-api:b4
docker compose up -d
```

### Option 3: Restore Supabase Data

Original Supabase data remains untouched. Backup created at:
```
/home/maskhar/backups/buzzerhood/supabase_buzzerhood_<timestamp>.dump
```

## Post-Launch Checklist

- [ ] All containers running (postgres, api, web)
- [ ] Health checks passing
- [ ] https://dev-buzzerhood.carubra.com loads correctly
- [ ] Network database displays data
- [ ] Partner registration form works
- [ ] Mobile responsive verified
- [ ] CORS working for frontend->API
- [ ] No console errors in browser
- [ ] Logs show no critical errors
- [ ] Data counts match Supabase source
- [ ] Backup created successfully
- [ ] Monitoring/alerts configured

## Troubleshooting

### Container Won't Start

```bash
docker compose logs <service_name>
docker compose restart <service_name>
```

### Database Connection Failed

Check .env.api DATABASE_URL matches buzzerhood_app password.

### API Returns 502

```bash
docker compose logs api
# Check if api container is healthy
docker inspect buzzerhood-api | grep Health
```

### Frontend Shows Network Database Error

- Verify API is accessible: curl https://api.dev-buzzerhood.carubra.com/api/v1/network
- Check browser DevTools Network tab for CORS errors
- Verify CORS_ORIGINS in .env.api includes production domain

### Migration Failed

```bash
# Check which migrations were applied
docker exec -it buzzerhood-postgres psql -U postgres -d buzzerhood -c "SELECT * FROM buzzerhood.schema_migrations ORDER BY version;"

# Re-run specific migration
docker exec -i buzzerhood-postgres psql -U postgres -d buzzerhood < database/migrations/0001_create_buzzerhood_schema.sql
```

## Maintenance Commands

```bash
# Stop all services
docker compose down

# Start all services
docker compose up -d

# Rebuild and restart
docker compose up -d --build

# View resource usage
docker stats

# Backup database
docker exec buzzerhood-postgres pg_dump -U postgres -Fc buzzerhood > backup_$(date +%Y%m%d).dump

# Restore database
docker exec -i buzzerhood-postgres pg_restore -U postgres -d buzzerhood --clean < backup.dump

# Clean up old images
docker image prune -a
```

## Security Notes

1. PostgreSQL is NOT exposed publicly (internal Docker network only)
2. API and Frontend bind to 127.0.0.1 (reverse proxy required)
3. All secrets are in /home/maskhar/docker/buzzerhood/secrets (chmod 600)
4. Registration is closed (AUTH_REGISTRATION_MODE=closed)
5. CORS restricted to production domains only
6. Containers run non-root with read-only filesystems
7. Security hardening: no-new-privileges, cap-drop

## Support

Repository: I:\website-devops\dev-buzzerhood.carubra.com
Documentation: docs/
Backend Docs: docs/BACKEND_ARCHITECTURE.md
Deployment Docs: docs/BACKEND_DEPLOYMENT_PLAN.md