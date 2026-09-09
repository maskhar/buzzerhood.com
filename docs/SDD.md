# SDD — Desain Sistem

> **Current architecture:** Browser -> Buzzerhood Backend API (NestJS + Fastify) -> Kysely/pg -> PostgreSQL schema `buzzerhood`. Supabase is not part of Buzzerhood application runtime and remains shared infrastructure outside this application boundary.

## Arsitektur

Frontend Vite React berkomunikasi hanya dengan Buzzerhood Backend API. Backend menjalankan autentikasi, otorisasi, validasi, dan akses PostgreSQL schema `buzzerhood` melalui Kysely/pg. MVP tidak memakai microservice, queue, Redis, atau backend kedua.

## Batas Domain

`auth`: bootstrap session/profil. `organizations`: tenant/RBAC. `partners`: profil, akun platform, metrik, rate. `campaigns`: brief, assignment, deliverable. `deliverables`: submission/review berversi. `publications`: bukti/metrik. `reports`: agregasi/export. `billing`: quotation/invoice/payment/payout. `admin`: verifikasi/audit.

## State Model

- Campaign: `draft`, `submitted`, `in_review`, `approved`, `active`, `reporting`, `completed`, `cancelled`.
- Assignment: `proposed`, `accepted`, `declined`, `active`, `completed`, `cancelled`.
- Deliverable: `pending`, `submitted`, `revision_requested`, `approved`, `published`, `cancelled`.
- Submission: `draft`, `submitted`, `revision_requested`, `approved`, `rejected`.

Transisi divalidasi oleh Backend API, RLS defense-in-depth, dan fungsi SQL terkontrol saat beberapa row serta audit event berubah bersama.

## Paritas Publik

Sumber memiliki navigasi anchor, hero CTA, render dinamis team/product/package, ticker metrik, pencarian jaringan, filter tier/platform, batas tabel 60 row, reveal-on-scroll, breakpoint responsif sekitar 640/820/900px, dan reduced-motion. Migrasi harus menjaga perilaku ini sebelum redesign.
