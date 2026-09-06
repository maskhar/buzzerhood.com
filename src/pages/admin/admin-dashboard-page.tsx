import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/use-auth';
import { listPublicPartnerApplications, type PublicPartnerApplicationStatus } from '@/features/admin/public-partner-applications-api';
import { apiQueryKeys } from '@/lib/api/query-keys';

const statuses: PublicPartnerApplicationStatus[] = ['pending', 'approved', 'rejected'];

export function AdminDashboardPage() {
  const { user } = useAuth();
  const pending = useQuery({ queryKey: apiQueryKeys.publicPartnerApplications(statuses[0]), queryFn: () => listPublicPartnerApplications(statuses[0]) });
  const approved = useQuery({ queryKey: apiQueryKeys.publicPartnerApplications(statuses[1]), queryFn: () => listPublicPartnerApplications(statuses[1]) });
  const rejected = useQuery({ queryKey: apiQueryKeys.publicPartnerApplications(statuses[2]), queryFn: () => listPublicPartnerApplications(statuses[2]) });
  const hasError = pending.isError || approved.isError || rejected.isError;

  const displayName = user?.displayName || 'Super Admin';
  const metrics = [
    { label: 'Menunggu review', value: pending.data?.meta.total ?? '—', detail: 'Perlu keputusan Anda', to: '/admin/partner-applications', className: 'metric-card-pending' },
    { label: 'Disetujui', value: approved.data?.meta.total ?? '—', detail: 'Akun Partner telah diproses', to: '/admin/partner-applications', className: 'metric-card-approved' },
    { label: 'Ditolak', value: rejected.data?.meta.total ?? '—', detail: 'Riwayat keputusan tersimpan', to: '/admin/partner-applications', className: 'metric-card-rejected' },
  ];

  return <section className="admin-dashboard">
    <div className="admin-dashboard-hero"><div><p className="eyebrow">SUPER ADMIN DASHBOARD</p><h1>Selamat datang, <span>{displayName}</span></h1><p>Pantau pendaftaran Partner, kelola akses user, dan cek konfigurasi operasional dari satu tempat.</p></div><aside className="dashboard-health"><span>Status sistem</span><strong>Terhubung</strong><small>Backend API dan workspace siap digunakan.</small></aside></div>
    <div className="metric-grid" aria-label="Ringkasan pendaftaran Partner">{metrics.map((metric) => <Link className={`metric-card ${metric.className}`} key={metric.label} to={metric.to}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small></Link>)}</div>
    {hasError ? <p className="form-message">Sebagian ringkasan gagal dimuat. Buka Program Partner untuk mencoba ulang.</p> : null}
    <div className="dashboard-section-heading"><div><p className="eyebrow">OPERASI UTAMA</p><h2>Mulai dari sini</h2></div><p>Pilih area kerja sesuai tugas yang ingin dikerjakan hari ini.</p></div>
    <div className="admin-shortcuts"><article><span className="shortcut-number">01 · Review</span><strong>Program Partner</strong><span>Review pendaftaran, keputusan approval, arsip, dan undangan akun Partner.</span><Link className="btn-solid" to="/admin/partner-applications">Buka review queue</Link></article><article><span className="shortcut-number">02 · Akses</span><strong>User Management</strong><span>Undang user, nonaktifkan akses, kirim reset password, atau hapus akun kosong.</span><Link className="btn-solid" to="/admin/users">Kelola user</Link></article><article><span className="shortcut-number">03 · Operasional</span><strong>Settings</strong><span>Periksa koneksi SMTP dan kirim email tes tanpa menampilkan secret server.</span><Link className="btn-solid" to="/admin/settings">Buka settings</Link></article></div>
  </section>;
}
