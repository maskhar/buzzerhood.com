# Buzzerhood Memory

## 2026-09-06 Backend-only directive

Owner removed external platform operational instructions from `AGENT.md` and `AGENTS.md`. Current project focus is the Buzzerhood Backend API plus PostgreSQL `buzzerhood` schema. Agents must not use remote shell/copy workflows or perform external deployment work from project instructions. Local backend development, migrations, validation, Git commits, and GitHub pushes remain allowed.

## 2026-09-06 Local Docker deployment

Active Buzzerhood development deployment runs on this computer through Docker. Primary Compose file is `docker/buzzerhood/docker-compose.yml`. Local containers: `buzzerhood-api` (`buzzerhood-api:b4`, `127.0.0.1:3100->3100`, healthy), `buzzerhood-web` (`buzzerhood-web:b4`, `127.0.0.1:8080->80`, healthy), and `buzzerhood-postgres` (`postgres:17-alpine`, database `buzzerhood`, healthy, volume `.docker-data/postgres`). Use this local Docker stack for API/WEB/Postgres verification. Preserve local database data unless owner approves destructive reset.
