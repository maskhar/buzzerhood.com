import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingState } from '@/components/common/loading-state';
import { useAuth } from '@/features/auth/use-auth';

export function ProtectedRoute() {
  const { isLoading, user } = useAuth();
  const location = useLocation();
  if (isLoading) return <LoadingState />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
