import { Navigate, Outlet } from 'react-router-dom';
import { LoadingState } from '@/components/common/loading-state';
import { useWorkspaceAccess } from '@/features/workspaces/use-workspace-access';
import type { WorkspaceKind } from '@/features/auth/auth-types';
import { AccessDeniedPage } from '@/pages/workspace/access-denied-page';

export function WorkspaceGuard({ kind }: { kind: WorkspaceKind }) {
  const access = useWorkspaceAccess();
  if (access.isPending) return <LoadingState />;
  if (access.isError) return <AccessDeniedPage workspace={kind} />;
  const allowed = access.data?.some((workspace) => workspace.kind === kind);
  if (!allowed) return <AccessDeniedPage workspace={kind} />;
  return <Outlet />;
}

export function WorkspaceEntryRedirect() {
  const access = useWorkspaceAccess();
  if (access.isPending) return <LoadingState />;
  if (access.isError) return <AccessDeniedPage workspace="workspace" />;
  if (!access.data?.length) return <Navigate to="/workspace" replace />;
  return <Navigate to={`/${access.data[0].kind}`} replace />;
}
