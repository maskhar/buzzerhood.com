# ERD

> **Phase B0 transition notice (2026-09-02):** This diagram is the current Supabase-era model. The future identity edge is `buzzerhood.users -> buzzerhood.profiles` while profile UUIDs and every downstream FK are preserved. See `docs/AUTH_ARCHITECTURE.md`.

```mermaid
erDiagram
  auth_users ||--|| profiles : owns
  profiles ||--o{ user_roles : receives
  roles ||--o{ user_roles : assigns
  roles ||--o{ role_permissions : maps
  permissions ||--o{ role_permissions : maps
  organizations ||--o{ organization_members : has
  profiles ||--o{ organization_members : joins
  organizations ||--o| partners : represents
  partners ||--o{ partner_platform_accounts : has
  partner_platform_accounts ||--o{ partner_audience_metrics : records
  organizations ||--o{ campaigns : owns
  campaigns ||--o{ campaign_partner_assignments : assigns
  partners ||--o{ campaign_partner_assignments : receives
  campaign_partner_assignments ||--o{ deliverables : contains
  deliverables ||--o{ content_submissions : versions
  content_submissions ||--o{ content_reviews : reviews
  deliverables ||--o{ publications : produces
  publications ||--o{ publication_metrics : measures
  campaigns ||--o{ campaign_reports : reports
  campaigns ||--o{ quotations : quotes
  quotations ||--o{ invoices : invoices
  campaign_partner_assignments ||--o{ partner_payouts : pays
  campaigns ||--o{ audit_events : audits
```

Foreign keys use UUIDs. Tenant root is `organizations`; active `organization_members` controls tenant access. Global system RBAC is separate from tenant membership.
