import { Link } from 'react-router-dom';
import type { WorkspaceKind } from '@/features/auth/auth-types';
import { useAuth } from '@/features/auth/use-auth';
import { useWorkspaceAccess } from '@/features/workspaces/use-workspace-access';

const labels: Record<WorkspaceKind, string> = { client: 'Client', partner: 'Partner', admin: 'Internal' };

export function WorkspaceDashboardPage({ kind }: { kind: WorkspaceKind }) {
  const { user } = useAuth();
  const access = useWorkspaceAccess();
  const workspaces = access.data?.filter((workspace) => workspace.kind === kind) ?? [];
  return <section><p className="eyebrow">{labels[kind]} DASHBOARD</p><h1>Selamat datang, {user?.email}</h1><p className="muted">Dashboard Backend Buzzerhood aktif. Data akses berasal dari API, bukan Supabase browser client.</p><div className="operational-grid"><article><span>Workspace aktif</span><strong>{workspaces.length}</strong></article><article><span>Role backend</span><strong>{user?.roles.join(', ') || 'member'}</strong></article><article><span>Status</span><strong>Connected</strong></article></div><div className="ops-list">{workspaces.map((workspace) => <article key={`${workspace.kind}-${workspace.organizationId ?? 'internal'}`}><strong>{workspace.organizationName}</strong><span>{labels[workspace.kind]} workspace</span></article>)}</div><p className="muted">Campaign, profile, dan operation pages tetap pada migration B4 berikutnya.</p><Link className="btn-outline" to="/workspace">Ganti workspace</Link></section>;
}
