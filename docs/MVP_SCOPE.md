# MVP Scope

> **Phase B0 transition notice (2026-09-02):** Replace “Supabase Auth” in the legacy scope below with custom Buzzerhood authentication delivered through the Backend API. Product scope is otherwise preserved.

## Included

Public marketing parity; organization tenancy; Supabase Auth; membership roles; partner directory; campaign workflow; versioned content review; publication/metrics; reports; manual commercial tracking; private files; audit events; RLS tests.

## Excluded

No public partner self-registration without review, no direct social scraping, no payment gateway, no mass email/SMS, no background queue, no recommendation algorithm, no marketplace checkout, no mobile app.

## Source Data Constraints

`NETWORK_DATA` contains 124 records. Preserve fields: `name`, `ig`, `ig_followers`, `tt`, `tt_followers`, `total`, `tier`, `platform`, `category`, `platform_category`, `metric_value`, `metric_label`, `niche`, `partner_type`.

Known quality issues: 9 records have zero total/absent Instagram values; 52 have absent or zero TikTok data; mixed `IG + TikTok` and `Instagram + TikTok` labels; `total` cannot be treated as one consistent metric for Website/YouTube/communities. Import must retain raw source and record issues.
