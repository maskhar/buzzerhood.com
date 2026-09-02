# Buzzerhood Platform

Buzzerhood adalah **Media, Influence & Distribution Network** yang sedang dibangun menjadi Campaign & Distribution Operating System.

## Stack

- Vite + React + TypeScript
- React Router + TanStack Query
- React Hook Form + Zod
- Supabase self-hosted client

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Browser `.env` hanya memakai `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`. Jangan masukkan service role, password database, JWT secret, atau SSH credential.

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm run build
```

## Database / Auth

- Auth identity: `auth.users`.
- Application profile: `buzzerhood.profiles`.
- Application tables: schema `buzzerhood`; browser accessor `getBuzzerhoodDb()` selalu memilih schema tersebut.
- Ordered local migration source: `database/migrations/`.
- `database/schema.sql` adalah baseline historis dan tidak boleh dideploy.
- Phase 2A menyiapkan profile trigger, system RBAC, organization membership, RLS, dan tests. Tidak ada migration yang sudah dijalankan.

## Type Generation

`src/lib/supabase/database.types.ts` dihasilkan dari PostgreSQL self-hosted live schema `buzzerhood` setelah Phase 2B. Jalankan `scripts/generate-types.cjs` hanya dengan output introspeksi aman; jangan commit URL atau password.

## Self-Hosted Gate

Project memakai Supabase self-hosted. Baca `docs/SUPABASE_PREFLIGHT.md` dan `docs/DATABASE_DEPLOYMENT_RUNBOOK.md` sebelum deployment. Phase 2A hanya melakukan preflight read-only; tidak ada perubahan server, Compose, `.env`, database, atau service.

## Documentation

- `docs/PRD.md`, `docs/MVP_SCOPE.md`, `docs/SDD.md`
- `docs/DATABASE_SCHEMA.md`, `docs/ERD.md`, `docs/RLS_POLICY.md`, `docs/SECURITY_MODEL.md`
- `docs/SUPABASE_PREFLIGHT.md`, `docs/DATABASE_DEPLOYMENT_RUNBOOK.md`, `docs/ADMIN_BOOTSTRAP.md`
- `database/README.md`, `database/tests/README.md`

## Legacy Reference

`buzzerhood.html` remains legacy design reference. `src/data/legacy/` remains transitional public data; no legacy network records were migrated.


## Phase 3 Network Activation
- Production database source: uzzerhood.public_network_partners; raw partner tables remain private.
- Run 
ode scripts/generate-legacy-network-import.cjs after reviewed legacy source updates, then review generated database/migrations/0009_legacy_network_import.sql.
- Client organizations use uzzerhood.create_client_organization; partner claims require internal approval.

