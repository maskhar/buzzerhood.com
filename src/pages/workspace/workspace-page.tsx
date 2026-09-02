import { useAuth } from '@/features/auth/use-auth';
import { useWorkspaceAccess } from '@/features/workspaces/use-workspace-access';

export function WorkspacePage() {
  const { user } = useAuth();
  const access = useWorkspaceAccess();
  if (access.isPending) return <main className="workspace-page"><p>Memuat akses workspace…</p></main>;
  if (access.isError) return <main className="workspace-page"><h1>Akses workspace belum tersedia.</h1><p>Database authorization belum aktif atau akses belum diberikan.</p></main>;
  if (!access.data?.length) return <main className="workspace-page"><h1>Workspace belum tersedia.</h1><p>{user?.email ?? 'User'} belum memiliki membership aktif. Hubungi administrator Buzzerhood.</p></main>;
  return <main className="workspace-page"><p className="eyebrow">AVAILABLE WORKSPACES</p><h1>Pilih workspace</h1><div className="workspace-list">{access.data.map((workspace) => <a href={`/${workspace.kind}`} key={`${workspace.kind}-${workspace.organizationId}`}><strong>{workspace.kind}</strong><span>{workspace.organizationName}</span></a>)}</div></main>;
}
