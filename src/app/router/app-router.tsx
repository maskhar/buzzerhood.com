import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { LoadingState } from '@/components/common/loading-state';
import { ProtectedRoute } from '@/features/auth/protected-route';
import { WorkspaceEntryRedirect, WorkspaceGuard } from '@/features/workspaces/workspace-guard';

const PublicHomePage = lazy(() => import('@/pages/public/public-home-page').then((module) => ({ default: module.PublicHomePage })));
const LoginPage = lazy(() => import('@/pages/public/login-page').then((module) => ({ default: module.LoginPage })));
const CampaignRequestPage = lazy(() => import('@/pages/public/campaign-request-page').then((module) => ({ default: module.CampaignRequestPage })));
const WorkspacePage = lazy(() => import('@/pages/workspace/workspace-page').then((module) => ({ default: module.WorkspacePage })));
const ClientLayout = lazy(() => import('@/layouts/dashboard-layouts').then((module) => ({ default: module.ClientLayout })));
const PartnerLayout = lazy(() => import('@/layouts/dashboard-layouts').then((module) => ({ default: module.PartnerLayout })));
const AdminLayout = lazy(() => import('@/layouts/dashboard-layouts').then((module) => ({ default: module.AdminLayout })));
const DashboardPlaceholder = lazy(() => import('@/pages/dashboard/dashboard-placeholder').then((module) => ({ default: module.DashboardPlaceholder })));

function load(element: React.ReactNode) { return <Suspense fallback={<LoadingState />}>{element}</Suspense>; }
function placeholder(title: string) { return load(<DashboardPlaceholder title={title} />); }

const router = createBrowserRouter([
  { path: '/', element: load(<PublicHomePage />) },
  { path: '/services', element: <Navigate to="/#layanan" replace /> },
  { path: '/network', element: <Navigate to="/#database" replace /> },
  { path: '/partner/register', element: load(<CampaignRequestPage partner />) },
  { path: '/campaign-request', element: load(<CampaignRequestPage />) },
  { path: '/login', element: load(<LoginPage />) },
  { element: <ProtectedRoute />, children: [
    { path: '/workspace', element: load(<WorkspacePage />) },
    { path: '/app', element: <WorkspaceEntryRedirect /> },
    { element: <WorkspaceGuard kind="client" />, children: [{ path: '/client', element: load(<ClientLayout />), children: [{ index: true, element: placeholder('Dashboard') }, { path: 'campaigns', element: placeholder('Campaigns') }, { path: 'reports', element: placeholder('Reports') }, { path: 'billing', element: placeholder('Billing') }, { path: 'team', element: placeholder('Team') }] }] },
    { element: <WorkspaceGuard kind="partner" />, children: [{ path: '/partner', element: load(<PartnerLayout />), children: [{ index: true, element: placeholder('Dashboard') }, { path: 'profile', element: placeholder('Profile') }, { path: 'platforms', element: placeholder('Platforms') }, { path: 'rates', element: placeholder('Rate card') }, { path: 'campaigns', element: placeholder('Campaigns') }, { path: 'earnings', element: placeholder('Earnings') }] }] },
    { element: <WorkspaceGuard kind="admin" />, children: [{ path: '/admin', element: load(<AdminLayout />), children: [{ index: true, element: placeholder('Dashboard') }, { path: 'clients', element: placeholder('Clients') }, { path: 'partners', element: placeholder('Partners') }, { path: 'campaigns', element: placeholder('Campaigns') }, { path: 'reports', element: placeholder('Reports') }, { path: 'billing', element: placeholder('Billing') }, { path: 'users', element: placeholder('Users') }, { path: 'settings', element: placeholder('Settings') }] }] },
  ] },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export function AppRouter() { return <RouterProvider router={router} />; }
