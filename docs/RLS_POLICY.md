# Kebijakan RLS

> **Phase B1 (2026-09-02):** backend policies use
> `buzzerhood.current_user_id()`, preferring transaction-local `app.user_id` and
> falling back to `auth.uid()`. `buzzerhood_app` has self-only identity/session
> policies and read-only RBAC reference access, with no BYPASSRLS or ownership.

> **Phase B1 transition notice (2026-09-02):** core policies/helpers resolve through `buzzerhood.current_user_id()`. Its `auth.uid()` fallback preserves current frontend compatibility while Backend traffic uses transaction-local identity.

## Model Otorisasi

Helper function mengambil akses dari `buzzerhood.current_user_id()` dan membership Buzzerhood. `organization_id`, `partner_id`, role, atau UUID dari client tidak pernah memberi akses.

| Aktor | Scope yang diizinkan |
|---|---|
| Anonymous | Hanya ringkasan partner yang eksplisit public. Tanpa rate, client, assignment, atau file private. |
| Client member | Campaign, report, quotation, invoice, dan data yang disetujui milik organisasi sendiri. |
| Partner member | Profil partner sendiri, assignment sendiri, deliverable, submission, publication, dan status payout. |
| Internal member | Data operasional sesuai izin internal. |
| Admin/Super admin | Akses lintas tenant melalui role membership; perubahan luar biasa diaudit. |

## Pola Kebijakan

1. Aktifkan dan paksa RLS untuk semua tabel bisnis.
2. Row langsung memakai helper membership `organization_id`.
3. Row tidak langsung memakai `EXISTS` melalui parent campaign, assignment, atau partner.
4. `WITH CHECK` mengulang pemeriksaan scope tulis.
5. Helper `SECURITY DEFINER` memakai `search_path = ''`, objek qualified, dan grant execute minimum.
6. Storage policy memverifikasi otorisasi `buzzerhood.files` sebelum select/upload/delete.

## Kasus Uji

- User A dalam client org tidak dapat membaca campaign User B melalui UUID.
- Partner tidak dapat mengenumerasi partner, rate, atau assignment lain.
- Client tidak dapat melihat invoice/payout client lain.
- Partner tidak dapat mengubah approval atau payment state.
- Anonymous tidak dapat mengakses objek private atau RPC signed URL.
- Service role tetap server-only; browser bundle tidak mengandung key privileged.

## Phase 2A Implementation Note

RLS helpers in `database/migrations/0004_security_functions_rls.sql` are narrowly scoped `SECURITY DEFINER` functions with `search_path = ''`. They evaluate only caller `auth.uid()` and do not accept arbitrary profile IDs, preventing role/membership probing and policy recursion. Organization access requires `status = 'active'`; invited, suspended, and removed membership has no access. Foundation tables default to deny because RLS is enabled and forced with no write policies for ordinary users.

