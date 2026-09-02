# Project Structure

```text
src/
  app/                 # routing, providers, layout
  shared/              # UI primitives, utilities, Supabase client, schemas
  features/
    auth/
    organizations/
    partners/
    campaigns/
    deliverables/
    publications/
    reports/
    billing/
    admin/
  pages/               # route composition only
  types/               # generated DB and shared contracts
database/
  migrations/          # future incremental files
  schema.sql           # architecture baseline, not production deployment script
```

Frontend calls application tables through `supabase.schema('buzzerhood')`. Never place service-role key in browser. Zod validates forms, route IDs, uploads, and RPC inputs. TanStack Query owns server cache; React Hook Form owns form state.

Routes: public `/`; auth `/sign-in`; client `/app/:organizationSlug`; partner `/partner`; internal `/ops`; admin `/admin`. Route guards improve UX only; RLS remains authorization boundary.
