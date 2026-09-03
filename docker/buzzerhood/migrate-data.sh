# Migration script to copy Buzzerhood data from Supabase PostgreSQL to dedicated PostgreSQL

# Source: Supabase PostgreSQL (supabase-db or external connection)
# Target: buzzerhood-postgres container

# This script should be run AFTER:
# 1. buzzerhood-postgres container is running
# 2. Migrations 0001-0018 have been applied
# 3. buzzerhood_app role has been created

# STEP 1: Export data from Supabase
# Connect to source database and export only Buzzerhood tables

SOURCE_HOST="supabase.carubra.com"
SOURCE_PORT="5432"
SOURCE_DB="postgres"
SOURCE_USER="postgres"

# Export only buzzerhood schema data (skip auth, storage, etc)
pg_dump -h $SOURCE_HOST -p $SOURCE_PORT -U $SOURCE_USER -d $SOURCE_DB \
  --schema=buzzerhood \
  --data-only \
  --no-owner \
  --no-privileges \
  --column-inserts \
  --disable-triggers \
  -f /tmp/buzzerhood_data_export.sql

# STEP 2: Import into dedicated PostgreSQL
docker cp /tmp/buzzerhood_data_export.sql buzzerhood-postgres:/tmp/
docker exec -i buzzerhood-postgres psql -U postgres -d buzzerhood -f /tmp/buzzerhood_data_export.sql

# STEP 3: Verify counts
echo "Verifying data migration..."

docker exec -it buzzerhood-postgres psql -U postgres -d buzzerhood -c "
SELECT 
  'partners' as table_name, COUNT(*) as count FROM buzzerhood.partners
UNION ALL
SELECT 'partner_legacy_imports', COUNT(*) FROM buzzerhood.partner_legacy_imports
UNION ALL
SELECT 'partner_platform_accounts', COUNT(*) FROM buzzerhood.partner_platform_accounts
UNION ALL
SELECT 'partner_metric_snapshots', COUNT(*) FROM buzzerhood.partner_metric_snapshots
UNION ALL
SELECT 'users', COUNT(*) FROM buzzerhood.users
UNION ALL
SELECT 'profiles', COUNT(*) FROM buzzerhood.profiles
UNION ALL
SELECT 'campaigns', COUNT(*) FROM buzzerhood.campaigns;
"

# STEP 4: Verify public network view
docker exec -it buzzerhood-postgres psql -U postgres -d buzzerhood -c "
SELECT COUNT(*) as public_network_count FROM buzzerhood.public_network_partners;
"

echo "Migration complete. Verify counts match source database."
