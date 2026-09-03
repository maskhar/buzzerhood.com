#!/bin/bash
# Production Deployment Script for Buzzerhood
# Run this on the production server: maskhar@20.20.20.173

set -e

echo "=== Buzzerhood Production Deployment ==="
echo ""

# Configuration
DEPLOY_DIR="/home/maskhar/docker/buzzerhood"
REPO_DIR="/home/maskhar/buzzerhood"
BACKUP_DIR="/home/maskhar/backups/buzzerhood"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "Step 1: Create deployment directory"
mkdir -p $DEPLOY_DIR
mkdir -p $BACKUP_DIR
cd $DEPLOY_DIR

echo ""
echo "Step 2: Copy Docker configuration from repository"
cp -r $REPO_DIR/docker/buzzerhood/* $DEPLOY_DIR/

echo ""
echo "Step 3: Generate secrets if not exists"
mkdir -p secrets
chmod 700 secrets

if [ ! -f secrets/postgres_password.txt ]; then
    echo "Generating PostgreSQL password..."
    openssl rand -base64 32 > secrets/postgres_password.txt
    chmod 600 secrets/postgres_password.txt
fi

if [ ! -f secrets/jwt-private.pem ]; then
    echo "Generating JWT keys..."
    openssl genpkey -algorithm ED25519 -out secrets/jwt-private.pem
    chmod 600 secrets/jwt-private.pem
    openssl pkey -in secrets/jwt-private.pem -pubout -out secrets/jwt-public.pem
    chmod 644 secrets/jwt-public.pem
fi

echo ""
echo "Step 4: Configure API environment"
if [ ! -f .env.api ]; then
    echo "Creating .env.api from example..."
    cp .env.api.example .env.api
    
    APP_PASSWORD=$(openssl rand -base64 32)
    sed -i "s/REPLACE_WITH_APP_PASSWORD/$APP_PASSWORD/g" .env.api
    chmod 600 .env.api
    
    echo "IMPORTANT: Review and update .env.api"
fi

echo ""
echo "Step 5: Build Docker images"
cd $REPO_DIR
docker compose -f docker/buzzerhood/docker-compose.yml build

echo ""
echo "Step 6: Start PostgreSQL"
cd $DEPLOY_DIR
docker compose up -d postgres
sleep 10

echo ""
echo "Step 7: Initialize database"
APP_PASS=$(grep "DATABASE_URL" .env.api | cut -d: -f3 | cut -d@ -f1)

docker exec -i buzzerhood-postgres psql -U postgres -d buzzerhood <<EOF
CREATE ROLE buzzerhood_app WITH LOGIN PASSWORD '$APP_PASS' NOCREATEDB NOCREATEROLE NOREPLICATION;
GRANT USAGE ON SCHEMA buzzerhood TO buzzerhood_app;
EOF

echo ""
echo "Step 8: Apply migrations"
cd $REPO_DIR/database/migrations
for migration in *.sql; do
    echo "Applying $migration..."
    docker exec -i buzzerhood-postgres psql -U postgres -d buzzerhood < "$migration"
done

echo ""
echo "Step 9: Grant permissions"
docker exec -i buzzerhood-postgres psql -U postgres -d buzzerhood <<EOF
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA buzzerhood TO buzzerhood_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA buzzerhood TO buzzerhood_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA buzzerhood TO buzzerhood_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA buzzerhood GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO buzzerhood_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA buzzerhood GRANT USAGE, SELECT ON SEQUENCES TO buzzerhood_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA buzzerhood GRANT EXECUTE ON FUNCTIONS TO buzzerhood_app;
EOF

echo ""
echo "Step 10: Backup Supabase data"
BACKUP_FILE="$BACKUP_DIR/supabase_buzzerhood_$TIMESTAMP.dump"
docker exec supabase-db pg_dump -U postgres -Fc -d postgres --schema=buzzerhood > "$BACKUP_FILE"

echo ""
echo "Step 11: Migrate data from Supabase"
docker exec supabase-db pg_dump -U postgres -d postgres --schema=buzzerhood --data-only --no-owner --no-privileges --column-inserts > /tmp/buzzerhood_data.sql
docker exec -i buzzerhood-postgres psql -U postgres -d buzzerhood < /tmp/buzzerhood_data.sql

echo ""
echo "Step 12: Verify data"
docker exec -i buzzerhood-postgres psql -U postgres -d buzzerhood -c "SELECT 'partners' as table_name, COUNT(*) FROM buzzerhood.partners UNION ALL SELECT 'platform_accounts', COUNT(*) FROM buzzerhood.partner_platform_accounts;"

echo ""
echo "Step 13: Start API and Web"
cd $DEPLOY_DIR
docker compose up -d api web
sleep 15

echo ""
echo "Step 14: Verify deployment"
docker compose ps
docker exec buzzerhood-postgres pg_isready -U postgres -d buzzerhood
curl -f http://127.0.0.1:3100/health
curl -f http://127.0.0.1:3100/ready
curl -f http://127.0.0.1:8080/health

echo ""
echo "=== Deployment Complete ==="