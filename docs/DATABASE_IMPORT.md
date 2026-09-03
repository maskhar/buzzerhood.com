# Database Deploy dan Import SQL

## Persistence

Compose memakai bind mount:

```text
.docker-data/postgres -> /var/lib/postgresql/data
```

Karena bukan named volume, `docker compose down -v` tidak menghapus data PostgreSQL. Tetap jangan menghapus `.docker-data/postgres` tanpa backup.

Backup:

```powershell
docker exec buzzerhood-postgres pg_dump -U postgres -d buzzerhood -Fc > buzzerhood-backup.dump
```

## Deploy fresh

```powershell
pwsh -File docker/buzzerhood/scripts/buzzerhood.ps1 -Action start
pwsh -File docker/buzzerhood/scripts/buzzerhood.ps1 -Action migrate
pwsh -File docker/buzzerhood/scripts/buzzerhood.ps1 -Action restart
```

`migrate` memakai file berurutan dari `database/migrations`. Jalankan sekali pada database baru. Jangan menjalankan migration lama berulang pada database yang sudah terisi kecuali script sudah memakai registry dan operator sudah memeriksa status.

## Import `.sql`

Import setelah schema dan role tersedia:

```powershell
pwsh -File docker/buzzerhood/scripts/buzzerhood.ps1 -Action import-sql -SqlFile .\data\buzzerhood-data.sql
```

Untuk dump custom format:

```powershell
pwsh -File docker/buzzerhood/scripts/buzzerhood.ps1 -Action import-sql -SqlFile .\data\buzzerhood-data.dump
```

## Verifikasi

```powershell
docker exec buzzerhood-postgres psql -U postgres -d buzzerhood -c "select count(*) from buzzerhood.partners;"
docker exec buzzerhood-postgres psql -U postgres -d buzzerhood -c "select count(*) from buzzerhood.public_network_partners;"
Invoke-RestMethod http://localhost:3100/api/v1/network
```

Frontend sekarang membaca `/api/v1/network`, bukan tabel Supabase langsung. Jika database berisi data tetapi UI kosong, cek API URL, container logs, migration `0008`, `0009`, dan response endpoint.
