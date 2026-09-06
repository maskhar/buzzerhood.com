# Buzzerhood Memory

## 2026-09-06 Backend-only directive

Owner removed external platform operational instructions from `AGENT.md` and `AGENTS.md`. Current project focus is the Buzzerhood Backend API plus PostgreSQL `buzzerhood` schema. Agents must not use remote shell/copy workflows or perform external deployment work from project instructions. Local backend development, migrations, validation, Git commits, and GitHub pushes remain allowed.

## 2026-09-06 Local Docker deployment

Active Buzzerhood development deployment runs on this computer through Docker. Primary Compose file is `docker/buzzerhood/docker-compose.yml`. Local containers: `buzzerhood-api` (`buzzerhood-api:b4`, `127.0.0.1:3100->3100`, healthy), `buzzerhood-web` (`buzzerhood-web:b4`, `127.0.0.1:8080->80`, healthy), and `buzzerhood-postgres` (`postgres:17-alpine`, database `buzzerhood`, healthy, volume `.docker-data/postgres`). Use this local Docker stack for API/WEB/Postgres verification. Preserve local database data unless owner approves destructive reset.

## 2026-09-06 Partner application archive checkpoint

Partner application duplicate validation and archive mode now work in local Docker. Migration `0028_partner_application_identity_lifecycle.sql` is applied to local `buzzerhood-postgres`; `buzzerhood-api` was rebuilt/recreated and healthy. Runtime-role smoke test for `buzzerhood.set_public_partner_application_archived` passed. Two previously failing application IDs are archived: `33e10656-b7ad-49a6-9b3d-bbc9fd7d0d16` and `35449188-a5b9-4589-b72c-0367fee613e2`. Local duplicate active identity `bimokharis1810@gmail.com` / `0817270898` had four older active duplicate applications archived non-destructively, keeping latest active. Next recommended work when returning: UI/admin lifecycle polish, restore conflict messaging, full reapply/reapproval smoke test, and audit partner membership uniqueness.
