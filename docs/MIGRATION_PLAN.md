# Migration Plan

## Public Source Migration

1. Snapshot `buzzerhood.html` and extract `NETWORK_DATA`, `TEAM`, `PRODUCTS`, `PACKAGES` without mutation.
2. Load raw network records to staging/import table or versioned seed JSON with source row index.
3. Map identity to `partners`; map Instagram/TikTok handles to `partner_platform_accounts`; map source primary metric to `partner_audience_metrics` with `metric_source = 'legacy_html'`.
4. Preserve zero/missing values as null/raw issue; never invent followers, handles, rates, verification, or demographic fields.
5. Report duplicates, normalized platform inconsistencies, and totals that combine incompatible metric types before approving records.
6. Create internal review queue. Publish only approved partner records to public preview.

## Known Source Findings

- 124 records; total stored audience `3,365,742`.
- Tier counts: Mega 6, Macro 16, Mid 39, Micro 62, Nano 1.
- Categories: Creator 101; Media/Public Figure 23.
- 9 records total zero, 9 absent/zero Instagram values, 52 absent/zero TikTok values.
- `platform` is display text; `platform_category` is a primary filter field. Both require normalization rules without overwriting source.

## Database Migration Sequence

Create schema/extensions/enums; identity and tenancy; partner directory; campaign workflow; commercial/reporting; grants/RLS; storage policies; seed/import. Each migration must be additive and reversible where practical. Run in isolated environment before production.
