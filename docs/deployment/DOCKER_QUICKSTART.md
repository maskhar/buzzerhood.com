# Docker Quickstart

Canonical compose: `docker/buzzerhood/docker-compose.yml`.

## Commands

```powershell
pwsh -File docker/buzzerhood/scripts/buzzerhood.ps1 -Action start
pwsh -File docker/buzzerhood/scripts/buzzerhood.ps1 -Action status
pwsh -File docker/buzzerhood/scripts/buzzerhood.ps1 -Action logs
pwsh -File docker/buzzerhood/scripts/buzzerhood.ps1 -Action restart
pwsh -File docker/buzzerhood/scripts/buzzerhood.ps1 -Action stop
```

Do not use old root scripts or `backend/docker-compose.yml`; those paths are retired.

Production reverse proxy should expose `dev-buzzerhood.carubra.com` to port `8080` and `api-buzzerhood.carubra.com` to port `3100`. Containers bind localhost only.
