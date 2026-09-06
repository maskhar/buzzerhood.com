import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEmailDiagnostics, sendEmailTest } from '@/features/admin/email-diagnostics-api';
import { useAuth } from '@/features/auth/use-auth';
import { apiErrorMessage } from '@/lib/api/errors';

export function AdminSettingsPage() {
  const { user } = useAuth();
  const diagnostics = useQuery({ queryKey: ['admin', 'email', 'diagnostics'], queryFn: getEmailDiagnostics });
  const [recipient, setRecipient] = useState(user?.email ?? '');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function sendTest() {
    setBusy(true);
    try {
      const result = await sendEmailTest(recipient);
      setMessage(result.delivered ? `Email tes dikirim ke ${recipient}.` : 'Email tes gagal dikirim. Periksa konfigurasi SMTP.');
    } catch (error) {
      setMessage(apiErrorMessage(error, 'Email tes gagal dikirim.'));
    } finally {
      setBusy(false);
    }
  }

  return <section className="admin-settings-page"><p className="eyebrow">SETTINGS</p><h1>Pengaturan operasional</h1><p className="muted">Status runtime yang aman untuk Super Admin. Password SMTP, JWT, database, dan secret lain tidak pernah ditampilkan.</p><div className="settings-grid"><article className="settings-card"><span className="settings-label">Email SMTP</span><strong>{diagnostics.isLoading ? 'Memeriksa…' : diagnostics.data?.verified ? 'Terverifikasi' : 'Perlu perhatian'}</strong><p>{diagnostics.data?.reason ?? 'Memeriksa koneksi SMTP dan sertifikat TLS.'}</p><label>Email tujuan<input type="email" value={recipient} onChange={(event) => setRecipient(event.target.value)} maxLength={254} /></label><button className="btn-solid" type="button" disabled={busy || !diagnostics.data?.configured || !recipient.trim()} onClick={() => void sendTest()}>Kirim email tes</button><small>Maksimal tiga email tes per jam untuk setiap Admin.</small>{message ? <small className="form-message">{message}</small> : null}</article><article className="settings-card"><span className="settings-label">Keamanan akun</span><strong>Registrasi publik tertutup</strong><p>Akun baru dibuat melalui undangan Super Admin. Pemilik akun membuat atau mereset password melalui tautan email satu-kali.</p><p>Hapus permanen hanya tersedia untuk akun tanpa relasi bisnis atau audit. Akun lain harus dinonaktifkan agar riwayat tetap utuh.</p></article></div></section>;
}
