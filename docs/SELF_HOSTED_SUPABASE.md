# Supabase Self-Hosted

Buzzerhood memakai Supabase self-hosted yang sudah ada. Tidak ada asumsi Supabase Cloud.

Sebelum perubahan database, PostgREST, storage, atau function:

1. SSH ke host terkonfigurasi lalu masuk `~/docker/supabase/supabase-1.26.05/docker`.
2. Periksa Compose, mounted volume, referensi `.env`, dan health service saat ini.
3. Pertahankan `PGRST_DB_SCHEMAS`; tambahkan `buzzerhood`, jangan mengganti daftar.
4. Terapkan hanya migration yang direview. Verifikasi schema USAGE/table/function grant dan RLS.
5. Untuk function periksa service `functions` dan source mapped; root diketahui `volumes/functions`.
6. Reload/recreate hanya service terdampak. Verifikasi Auth, Storage, PostgREST, health, dan log.

Jangan reset stack, menghapus volume, menimpa Compose/`.env`, atau mengubah workload lain. Secret tetap pada konfigurasi server, bukan repository/dokumentasi.

## Phase 2A Update

Read-only preflight findings and deployment gate are recorded in `docs/SUPABASE_PREFLIGHT.md`. Ordered local migrations are now the deployment source; no production configuration or database state was changed.

## Phase 2B Update

Ordered migrations `0001`–`0006` deployed on 2026-09-02 after disposable migration tests, server precheck, and validated backup. `buzzerhood` PostgREST schema exposure is active. Deployment record: `docs/PHASE_2B_DEPLOYMENT_REPORT.md`.
