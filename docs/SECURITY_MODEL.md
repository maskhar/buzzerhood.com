# Model Keamanan

Kontrol ancaman: RLS dan membership mencegah IDOR/akses lintas tenant; Zod memvalidasi input tidak tepercaya; `auth.users` menyimpan credential; `buzzerhood.profiles` menyimpan identitas aplikasi; service role hanya konteks server tepercaya; file private memakai private bucket dan signed URL singkat; tabel rate/invoice/payout tidak masuk public API.

Kontrol operasional: secret hanya konfigurasi server; tidak ada secret pada `VITE_*`; migration inkremental; audit perubahan bernilai tinggi; least-privilege grant; konfigurasi schema PostgREST non-public eksplisit; log tidak menyimpan secret atau credential pembayaran mentah.

Review wajib sebelum merge: jalur otorisasi, RLS `USING` dan `WITH CHECK`, scope organisasi/partner, validasi storage path, kebocoran error, audit event, dan coverage test.
