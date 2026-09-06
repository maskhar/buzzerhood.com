import { useState } from 'react';
import { Link } from 'react-router-dom';
import { updateCurrentUserProfile } from '@/lib/api/auth';
import { apiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/features/auth/use-auth';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await updateCurrentUserProfile(displayName);
      await refreshUser();
      setMessage('Profil berhasil diperbarui.');
    } catch (error) {
      setMessage(apiErrorMessage(error, 'Profil gagal diperbarui.'));
    } finally {
      setBusy(false);
    }
  }

  return <main className="profile-page"><Link className="brand" to="/app">BUZZER<span>HOOD</span></Link><section className="profile-card"><p className="eyebrow">PROFILE</p><h1>Edit profil</h1><p>Perbarui nama yang tampil pada dashboard. Email dipertahankan untuk keamanan akun dan perubahan email memerlukan alur verifikasi terpisah.</p><form onSubmit={submit}><label>Nama tampilan<input required value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={1} maxLength={120} autoComplete="name" /></label><label>Email akun<input value={user?.email ?? ''} readOnly aria-readonly="true" /></label><small>Email belum dapat diubah dari dashboard.</small><button className="btn-solid" type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan perubahan'}</button>{message ? <p className="form-message" role="status">{message}</p> : null}</form></section></main>;
}
