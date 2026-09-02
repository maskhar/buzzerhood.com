# SDD — Desain Sistem

## Arsitektur

Frontend modular Vite React berkomunikasi langsung dengan Supabase self-hosted melalui Auth, PostgREST, Storage, serta Edge Function/RPC yang sempit bila diperlukan. PostgreSQL `buzzerhood` adalah schema aplikasi. MVP tidak memakai microservice, queue, Redis, atau backend kedua.

## Batas Domain

`auth`: bootstrap session/profil. `organizations`: tenant/RBAC. `partners`: profil, akun platform, metrik, rate. `campaigns`: brief, assignment, deliverable. `deliverables`: submission/review berversi. `publications`: bukti/metrik. `reports`: agregasi/export. `billing`: quotation/invoice/payment/payout. `admin`: verifikasi/audit.

## State Model

- Campaign: `draft`, `submitted`, `in_review`, `approved`, `active`, `reporting`, `completed`, `cancelled`.
- Assignment: `proposed`, `accepted`, `declined`, `active`, `completed`, `cancelled`.
- Deliverable: `pending`, `submitted`, `revision_requested`, `approved`, `published`, `cancelled`.
- Submission: `draft`, `submitted`, `revision_requested`, `approved`, `rejected`.

Transisi divalidasi oleh RLS serta transaction/RPC jika beberapa row dan audit event berubah bersama.

## Paritas Publik

Sumber memiliki navigasi anchor, hero CTA, render dinamis team/product/package, ticker metrik, pencarian jaringan, filter tier/platform, batas tabel 60 row, reveal-on-scroll, breakpoint responsif sekitar 640/820/900px, dan reduced-motion. Migrasi harus menjaga perilaku ini sebelum redesign.
