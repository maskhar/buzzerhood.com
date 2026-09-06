import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { activateAccount, resetPassword } from '@/features/auth/account-action-api';
import { apiErrorMessage } from '@/lib/api/errors';

export function AccountPasswordPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const activation = location.pathname === '/activate-partner';
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage('');
    if (!token) { setMessage('Token tidak ditemukan pada tautan email.'); return; }
    if (password.length < 12) { setMessage('Password minimal 12 karakter.'); return; }
    if (password !== confirmation) { setMessage('Konfirmasi password tidak sama.'); return; }
    setBusy(true);
    try {
      if (activation) await activateAccount(token, password);
      else await resetPassword(token, password);
      setComplete(true);
      setMessage(activation ? 'Akun aktif. Silakan masuk dengan password baru.' : 'Password berhasil diganti. Silakan masuk kembali.');
    } catch (error) {
      setMessage(apiErrorMessage(error, activation ? 'Undangan tidak valid atau sudah kedaluwarsa.' : 'Token reset tidak valid atau sudah kedaluwarsa.'));
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-page"><Link className="brand" to="/">BUZZER<span>HOOD</span></Link><section className="auth-card"><p className="eyebrow">{activation ? 'ACCOUNT ACTIVATION' : 'PASSWORD RESET'}</p><h1>{activation ? 'Buat password akun' : 'Buat password baru'}</h1><p>{activation ? 'Aktifkan akun dari undangan Buzzerhood.' : 'Gunakan tautan email untuk mengganti password akun.'}</p>{complete ? <><p className="form-message" role="status">{message}</p><Link className="btn-solid" to="/login">Masuk sekarang</Link></> : <form onSubmit={submit}><label>Password baru<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} maxLength={128} required /></label><label>Ulangi password<input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={12} maxLength={128} required /></label><button className="btn-solid" disabled={busy || !token} type="submit">{busy ? 'Memproses…' : activation ? 'Aktifkan akun' : 'Ganti password'}</button>{!token ? <p className="form-message">Tautan tidak memiliki token. Buka kembali tautan lengkap dari email.</p> : null}{message ? <p className="form-message" role="status">{message}</p> : null}</form>}</section></main>;
}
