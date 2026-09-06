import { Link } from 'react-router-dom';
import type { WorkspaceKind } from '@/features/auth/auth-types';
import { useAuth } from '@/features/auth/use-auth';
import { useWorkspaceAccess } from '@/features/workspaces/use-workspace-access';
import './workspace-dashboard-page.css';

const labels: Record<WorkspaceKind, string> = { client: 'Client', partner: 'Partner', admin: 'Internal' };

export function WorkspaceDashboardPage({ kind }: { kind: WorkspaceKind }) {
  const { user } = useAuth();
  const access = useWorkspaceAccess();
  const workspaces = access.data?.filter((workspace) => workspace.kind === kind) ?? [];
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Workspace member';
  const primaryWorkspace = workspaces[0];
  const destination = kind === 'client' ? '/client/campaigns' : '/partner/campaigns';

  return <section className="workspace-dashboard-page">
    <header className="workspace-hero"><div><p className="eyebrow">{labels[kind]} DASHBOARD</p><h1>Selamat datang, <span>{displayName}</span></h1><p>Kelola aktivitas {labels[kind].toLowerCase()} dari satu workspace terpusat.</p></div><div className="workspace-status"><span className="status-dot"/><div><strong>Workspace aktif</strong><small>Backend API terhubung</small></div></div></header>
    <div className="workspace-metrics"><article><span>Workspace</span><strong>{workspaces.length}</strong><small>akses aktif</small></article><article><span>Peran Anda</span><strong>{user?.roles[0] || 'Member'}</strong><small>akses terverifikasi</small></article><article><span>Status</span><strong>Siap</strong><small>semua sistem normal</small></article></div>
    <div className="workspace-main-grid"><article className="workspace-context-card"><p className="form-kicker">WORKSPACE ANDA</p><h2>{primaryWorkspace?.organizationName || 'Workspace belum dipilih'}</h2><p>Ruang kerja ini menghubungkan aktivitas, anggota, dan campaign Anda.</p><dl><div><dt>Tipe</dt><dd>{labels[kind]} workspace</dd></div><div><dt>Akses</dt><dd>{user?.roles.join(', ') || 'Member'}</dd></div></dl><Link className="btn-solid" to={destination}>{kind === 'client' ? 'Buka campaign' : 'Lihat assignment'}</Link></article><aside className="workspace-next-card"><p className="form-kicker">LANGKAH BERIKUTNYA</p><strong>{kind === 'client' ? 'Susun campaign brief' : 'Cek assignment terbaru'}</strong><p>{kind === 'client' ? 'Mulai dari tujuan campaign dan kirim draft untuk review internal.' : 'Lihat campaign yang ditugaskan dan kelola deliverable Anda.'}</p><Link className="btn-ghost" to={destination}>Mulai sekarang</Link></aside></div>
    <Link className="workspace-switch-link" to="/workspace">Ganti workspace</Link>
  </section>;
}
