# Strategi Deployment

> **Phase B0 transition notice (2026-09-02):** Existing Supabase deployment procedures remain valid for legacy/shared services. The future Buzzerhood API deploys independently as documented in `docs/BACKEND_DEPLOYMENT_PLAN.md`; B0 performs no deployment or infrastructure change.

## Tahap

1. Local development dengan environment kompatibel Supabase non-production.
2. Staging/non-production migration dan uji workflow RLS.
3. Production release ter-review saat maintenance window bila diperlukan.

## Urutan Rilis

1. Jalankan build/typecheck/test frontend.
2. Backup atau konfirmasi recovery path untuk scope migration.
3. Terapkan satu migration additive yang direview.
4. Verifikasi schema exposure PostgREST dan grant.
5. Deploy static frontend.
6. Upload hanya folder Edge Function target bila perlu; recreate hanya `functions` setelah inspeksi Compose.
7. Smoke test situs publik, Auth, Storage, API, scope RLS, campaign flow, dan log.

## Rollback

Frontend kembali ke static artifact sebelumnya. Rollback database harus eksplisit dan menjaga data; prioritaskan forward fix dibanding down migration destruktif. Jangan menjalankan rollback destruktif tanpa approval dan recovery path teruji.

## Phase 2A Update

Use `database/migrations/` as the approved migration sequence. Current PostgREST schema configuration lacks `buzzerhood`; `docs/DATABASE_DEPLOYMENT_RUNBOOK.md` records the future append-only configuration delta and approval gate.
