# B1 dark deployment

Deploy this Compose project independently at `/home/maskhar/docker/buzzerhood-api`.
Keep `secrets/backend.env`, `secrets/database-password`, and both JWT PEM files mode
`0600`; none belong in Git. The only published listener is server-local
`127.0.0.1:3100`. The container joins the existing `supabase_default` network to
reach `supabase-db` and does not modify the Supabase Compose project.
The production Compose override runs as the deployment account's non-root
UID/GID 1000 so Docker's bind-backed secrets remain readable at host mode 0600.

The API never auto-runs migrations. Apply reviewed SQL separately with the
controlled migration principal. Production registration and Swagger remain closed.
