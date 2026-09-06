import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createAdminUser, deleteAdminUser, listAdminUsers, sendAdminUserPasswordReset, setAdminUserActive } from '@/features/admin/users-api';
import { apiErrorMessage } from '@/lib/api/errors';

type AdminRole = 'internal_team' | 'admin' | 'super_admin';

const roleOptions: { value: AdminRole; label: string; description: string }[] = [
  { value: 'internal_team', label: 'Internal Team', description: 'Akses operasional harian sesuai permission tim.' },
  { value: 'admin', label: 'Admin', description: 'Kelola operasi dan data lintas workspace.' },
  { value: 'super_admin', label: 'Super Admin', description: 'Akses tertinggi termasuk pengelolaan user.' },
];

const roleLabels: Record<string, string> = { internal_team: 'Internal Team', admin: 'Admin', super_admin: 'Super Admin' };

export function UsersPage() {
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: ['api', 'admin', 'users'], queryFn: listAdminUsers });
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<AdminRole>('internal_team');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() { await queryClient.invalidateQueries({ queryKey: ['api', 'admin', 'users'] }); }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await createAdminUser({ email, displayName, role });
      setEmail('');
      setDisplayName('');
      setRole('internal_team');
      setMessage('Undangan user berhasil dikirim.');
      await refresh();
    } catch (error) {
      setMessage(apiErrorMessage(error, 'User gagal dibuat.'));
    } finally {
      setBusy(false);
    }
  }

  async function status(id: string, active: boolean) {
    setBusy(true);
    try {
      await setAdminUserActive(id, active);
      setMessage(active ? 'User berhasil diaktifkan.' : 'User dinonaktifkan dan seluruh sesi dicabut.');
      await refresh();
    } catch (error) {
      setMessage(apiErrorMessage(error, 'Status user gagal diubah.'));
    } finally {
      setBusy(false);
    }
  }

  async function reset(id: string, emailAddress: string) {
    if (!window.confirm(`Kirim tautan reset password ke ${emailAddress}?`)) return;
    setBusy(true);
    try {
      await sendAdminUserPasswordReset(id);
      setMessage(`Email reset password dikirim ke ${emailAddress}.`);
    } catch (error) {
      setMessage(apiErrorMessage(error, 'Email reset password gagal dikirim.'));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, emailAddress: string) {
    if (!window.confirm(`Hapus permanen akun ${emailAddress}? Tindakan ini hanya berhasil untuk akun tanpa relasi bisnis atau audit.`)) return;
    setBusy(true);
    try {
      await deleteAdminUser(id);
      setMessage(`Akun ${emailAddress} dihapus permanen.`);
      await refresh();
    } catch (error) {
      setMessage(apiErrorMessage(error, 'Akun tidak dapat dihapus.'));
    } finally {
      setBusy(false);
    }
  }

  return <section className="admin-users-page">
    <header className="admin-page-heading"><div><p className="eyebrow">USER MANAGEMENT</p><h1>Kelola user</h1></div><p>Tambah akses tim, atur status akun, dan kirim pemulihan password tanpa mengetahui password user.</p></header>

    <form className="admin-invite-card" onSubmit={submit}>
      <div className="admin-invite-heading"><div><span className="admin-step">01</span><div><h2>Undang user baru</h2><p>User akan menerima email untuk membuat password sendiri.</p></div></div><span className="admin-secure-label">Undangan aman</span></div>
      <div className="admin-invite-fields"><label>Nama lengkap<span>Nama yang tampil di dashboard</span><input required value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={120} placeholder="Contoh: Bimo Kharismantoro" /></label><label>Email<span>Alamat penerima undangan</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} placeholder="nama@perusahaan.com" /></label></div>
      <fieldset className="admin-role-picker"><legend>Pilih role</legend><p>Tentukan tingkat akses awal untuk user ini.</p><div>{roleOptions.map((option) => <label className={role === option.value ? 'selected' : ''} key={option.value}><input type="radio" name="role" value={option.value} checked={role === option.value} onChange={() => setRole(option.value)} /><span><strong>{option.label}</strong><small>{option.description}</small></span></label>)}</div></fieldset>
      <footer><p>Role dapat disesuaikan kembali melalui kebijakan akses.</p><button className="btn-solid" disabled={busy} type="submit">{busy ? 'Mengirim…' : 'Tambah & kirim undangan'}</button></footer>
    </form>

    {message ? <p className="admin-feedback" role="status">{message}</p> : null}

    <section className="admin-user-list"><div className="admin-user-list-heading"><div><span className="admin-step">02</span><div><h2>Daftar user</h2><p>{users.data ? `${users.data.length} akun terdaftar` : 'Memuat akun…'}</p></div></div></div><div className="db-table-wrap">{users.data ? <table className="db-table admin-users-table"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{users.data.map((user) => <tr key={user.id}><td><strong>{user.displayName || 'Tanpa nama'}</strong><span>{user.email}</span></td><td><div className="role-tags">{user.roles.length ? user.roles.map((item) => <span key={item}>{roleLabels[item] ?? item}</span>) : <span>Belum ada role</span>}</div></td><td><span className={`user-status user-status-${user.status}`}>{user.status.replace('_', ' ')}</span></td><td><div className="table-actions"><button className="btn-ghost compact-button" disabled={busy} onClick={() => void status(user.id, user.status !== 'active')}>{user.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}</button><button className="btn-ghost compact-button" disabled={busy || user.status !== 'active'} onClick={() => void reset(user.id, user.email)}>Reset password</button><button className="btn-danger compact-button" disabled={busy} onClick={() => void remove(user.id, user.email)}>Hapus</button></div></td></tr>)}</tbody></table> : <p className="db-empty">Memuat user…</p>}</div></section>
  </section>;
}
