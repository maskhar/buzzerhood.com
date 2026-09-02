# Kontrak API

## Akses

Browser memakai session Supabase Auth dan PostgREST hanya untuk read/write yang dilindungi RLS. Akses schema aplikasi memakai `supabase.schema('buzzerhood')`. RPC dipakai hanya untuk aksi transaksional multi-langkah atau penerbitan signed URL terkontrol.

## Resource Inti

| Resource | Operasi |
|---|---|
| `campaigns` | Client membuat draft; internal review/update; aktor ber-scope membaca. |
| `campaign_partner_assignments` | Internal assign; partner accept/decline; transisi diaudit. |
| `deliverables` | Internal/client menentukan; partner submit hanya milik assignment sendiri. |
| `content_submissions` | Revisi insert-only; reviewer mencatat keputusan pada `content_reviews`. |
| `publications` | Partner membuat publication untuk assignment sendiri; internal/client membaca sesuai scope. |
| `publication_metrics` | Partner/internal memasukkan metrik dengan source dan period. |
| `files` | Metadata merujuk object key private; layanan signed URL memeriksa parent access. |

## Kandidat RPC Terkontrol

- `buzzerhood.create_campaign_with_brief(...)`
- `buzzerhood.transition_assignment_status(...)`
- `buzzerhood.request_content_revision(...)`
- `buzzerhood.issue_file_signed_url(...)`

Setiap RPC memvalidasi membership pemanggil, memakai `SECURITY INVOKER` kecuali ada kebutuhan `SECURITY DEFINER` sempit dan audited, serta tidak mengembalikan secret.
