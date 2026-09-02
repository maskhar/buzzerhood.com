# PRD — Buzzerhood Platform

## Ringkasan Produk

Buzzerhood berkembang dari situs pemasaran menjadi **Campaign & Distribution Operating System**. Platform menghubungkan brand, perusahaan, agensi, organisasi pemerintah, media, KOL, influencer, kreator, komunitas, dan tim internal untuk menjalankan distribusi campaign dari brief sampai laporan.

Sumber produk saat ini: `buzzerhood.html` (872 baris, 124 entri jaringan). Visual publik tetap dark/orange, tipografi Big Shoulders Display dan Inter, serta interaksi pencarian/filter jaringan.

## Pengguna dan Nilai

| Pengguna | Nilai utama |
|---|---|
| CLIENT | Mengajukan brief, memantau status, menyetujui konten/komersial, melihat laporan. |
| PARTNER | Menerima assignment, mengirim konten, merekam publikasi dan metrik. |
| INTERNAL | Mengelola partner, campaign, review, dan pelaporan. |
| ADMIN | Mengelola akses dan operasi lintas organisasi. |
| SUPER_ADMIN | Akses administrasi luar biasa dan audit. |

## Alur MVP

`draft brief` → internal review → partner assignment → partner acceptance → content submission → revision/approval → publication → metrics → report → completion.

Setiap perubahan penting tercatat. Revisi konten selalu membuat versi baru, tidak menimpa draft lama.

## Ruang Lingkup MVP

- Situs publik setara sumber: hero, tim delapan peran, komposisi jaringan, tujuh layanan, lima paket, database preview, CTA/kontak.
- Auth, profil, organisasi, membership, dan RBAC.
- Partner network, akun platform, metrik dengan jenis dan periode, verifikasi, rate private.
- Campaign, assignment, deliverable, review konten, publikasi, metrik, report.
- Quotation, invoice, payment/payout state manual dan auditable.

## Post-MVP

Notifikasi otomatis, integrasi platform sosial/payment, workflow approval kompleks, forecasting, recommendation engine, advanced analytics, dan automation.

## Kriteria Keberhasilan MVP

- Client hanya dapat membaca/menulis data organisasi sendiri.
- Partner hanya melihat assignment dan data partner sendiri.
- Tim dapat menyelesaikan satu campaign tanpa spreadsheet sebagai sumber status utama.
- Riwayat konten, status, publikasi, metrik, dan keputusan dapat diaudit.
- Situs publik mempertahankan data, struktur konten, dan identitas visual sumber.

## Open Questions

### BLOCKING

1. Definisi organisasi partner: satu partner dapat dimiliki banyak user tetapi apakah selalu satu `partner_organization`?
2. Siapa pemilik final approval konten: CLIENT, INTERNAL, atau keduanya bergantung campaign?
3. Mekanisme legal invoice/payout: nomor dokumen, pajak, dan mata uang awal?

### NON-BLOCKING

1. Bahasa UI awal: rekomendasi Bahasa Indonesia dengan struktur i18n-ready.
2. Standar tier: rekomendasi simpan tier sumber tanpa memvalidasi ulang dengan follower threshold.
3. Refresh metrik: rekomendasi manual/CSV audited pada MVP.
