import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/use-auth';
import { listPublicPartnerApplications, type PublicPartnerApplicationStatus } from '@/features/admin/public-partner-applications-api';
import { apiQueryKeys } from '@/lib/api/query-keys';
import { getEmailDiagnostics, sendEmailTest } from '@/features/admin/email-diagnostics-api';
import { useState } from 'react';

const statuses: PublicPartnerApplicationStatus[] = ['pending', 'approved', 'rejected'];

export function AdminDashboardPage() {
  const { user } = useAuth();
  const pending = useQuery({ queryKey: apiQueryKeys.publicPartnerApplications(statuses[0]), queryFn: () => listPublicPartnerApplications(statuses[0]) });
  const approved = useQuery({ queryKey: apiQueryKeys.publicPartnerApplications(statuses[1]), queryFn: () => listPublicPartnerApplications(statuses[1]) });
  const rejected = useQuery({ queryKey: apiQueryKeys.publicPartnerApplications(statuses[2]), queryFn: () => listPublicPartnerApplications(statuses[2]) });
  const hasError = pending.isError || approved.isError || rejected.isError;
  const email = useQuery({ queryKey: ['admin', 'email', 'diagnostics'], queryFn: getEmailDiagnostics });
  const [emailMessage, setEmailMessage] = useState<string>();
  const testEmail = async () => { try { const result = await sendEmailTest(); setEmailMessage(result.delivered ? `Email tes dikirim ke ${user?.email}.` : 'Email tes gagal dikirim. Periksa sertifikat TLS SMTP.'); } catch { setEmailMessage('Pemeriksaan email gagal.'); } };

  return <section>
    <p className="eyebrow">SUPER ADMIN DASHBOARD</p>
    <h1>Selamat datang, {user?.displayName || user?.email}</h1>
    <p className="muted">Pantau pendaftaran Program Partner dan lakukan review melalui Backend API.</p>
    <div className="operational-grid">
      <article><span>Menunggu review</span><strong>{pending.data?.meta.total ?? '—'}</strong></article>
      <article><span>Disetujui</span><strong>{approved.data?.meta.total ?? '—'}</strong></article>
      <article><span>Ditolak</span><strong>{rejected.data?.meta.total ?? '—'}</strong></article>
    </div>
    {hasError ? <p className="form-message">Sebagian ringkasan gagal dimuat. Buka Program Partner untuk mencoba ulang.</p> : null}
    <div className="ops-list"><article><strong>Program Partner</strong><span>Review pendaftaran, catatan keputusan, dan status approval.</span><Link className="btn-solid" to="/admin/partner-applications">Buka review queue</Link></article><article><strong>Email SMTP</strong><span>{email.isLoading ? 'Memeriksa konfigurasi…' : email.data?.verified ? 'SMTP terhubung. Secret tidak ditampilkan.' : email.data?.reason ?? 'Status belum tersedia.'}</span><button className="btn-solid" type="button" disabled={!email.data?.configured} onClick={() => void testEmail()}>Kirim email tes ke saya</button>{emailMessage ? <small>{emailMessage}</small> : null}</article></div>
  </section>;
}
