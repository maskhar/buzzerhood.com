# Buzzerhood Documentation

## Mulai cepat

1. Salin `docker/buzzerhood/.env.api.example` menjadi `docker/buzzerhood/.env.api`.
2. Salin `.env.production.example` menjadi `.env.production`.
3. Jalankan `pwsh -File docker/buzzerhood/scripts/buzzerhood.ps1 -Action start`.
4. Pada database baru, jalankan `pwsh -File docker/buzzerhood/scripts/buzzerhood.ps1 -Action migrate`.
5. Cek `status`, endpoint `/health`, lalu buka frontend.

## Struktur

- `architecture/` — arsitektur, auth, schema, security, migration.
- `deployment/` — Docker, server, CI/CD, network.
- `guides/` — panduan environment dan operasi.
- `reports/` — hasil audit dan status milestone.
- `setup/` — setup awal.
- `DATABASE_IMPORT.md` — import SQL dan verifikasi data.
- `ENVIRONMENT.md` — sumber env tiap komponen.

## Aturan data

PostgreSQL memakai bind mount lokal `.docker-data/postgres`. `docker compose down -v` tidak menghapus folder itu, tetapi penghapusan manual folder atau `docker compose down` dengan compose lama tetap berisiko. Backup sebelum operasi produksi.
