import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { LoadingState } from '@/components/common/loading-state';
import { ProtectedRoute } from '@/features/auth/protected-route';
import { WorkspaceEntryRedirect, WorkspaceGuard } from '@/features/workspaces/workspace-guard';

const PublicHomePage = lazy(() => import('@/pages/public/public-home-page').then((module) => ({ default: module.PublicHomePage })));
const LoginPage = lazy(() => import('@/pages/public/login-page').then((module) => ({ default: module.LoginPage })));
const AccountPasswordPage = lazy(() => import('@/pages/public/account-password-page').then((module) => ({ default: module.AccountPasswordPage })));
const CampaignRequestPage = lazy(() => import('@/pages/public/campaign-request-page').then((module) => ({ default: module.CampaignRequestPage })));
const WorkspacePage = lazy(() => import('@/pages/workspace/workspace-page').then((module) => ({ default: module.WorkspacePage })));
const ClientLayout = lazy(() => import('@/layouts/dashboard-layouts').then((module) => ({ default: module.ClientLayout })));
const PartnerLayout = lazy(() => import('@/layouts/dashboard-layouts').then((module) => ({ default: module.PartnerLayout })));
const AdminLayout = lazy(() => import('@/layouts/dashboard-layouts').then((module) => ({ default: module.AdminLayout })));
const ClientOnboardingPage = lazy(() => import('@/pages/onboarding/client-onboarding-page').then((module) => ({ default: module.ClientOnboardingPage })));
const PartnerRegisterPage = lazy(() => import('@/pages/onboarding/partner-register-page').then((module) => ({ default: module.PartnerRegisterPage })));
const DashboardPlaceholder = lazy(() => import('@/pages/dashboard/dashboard-placeholder').then((module) => ({ default: module.DashboardPlaceholder })));
const WorkspaceDashboardPage = lazy(() => import('@/pages/dashboard/workspace-dashboard-page').then((module) => ({ default: module.WorkspaceDashboardPage })));
const PublicPartnerApplicationsPage = lazy(() => import('@/pages/admin/public-partner-applications-page').then((module) => ({ default: module.PublicPartnerApplicationsPage })));
const AdminDashboardPage = lazy(() => import('@/pages/admin/admin-dashboard-page').then((module) => ({ default: module.AdminDashboardPage })));
const UsersPage = lazy(() => import('@/pages/admin/users-page').then((module) => ({ default: module.UsersPage })));
const AdminSettingsPage = lazy(() => import('@/pages/admin/admin-settings-page').then((module) => ({ default: module.AdminSettingsPage })));

function load(element: React.ReactNode) { return <Suspense fallback={<LoadingState />}>{element}</Suspense>; }
function placeholder(title: string) { return load(<DashboardPlaceholder title={title} />); }

const router = createBrowserRouter([
  { path: '/', element: load(<PublicHomePage />) },
  { path: '/services', element: <Navigate to="/#layanan" replace /> },
  { path: '/network', element: <Navigate to="/#database" replace /> },
  { path: '/partner/register-info', element: load(<CampaignRequestPage partner />) },
  { path: '/campaign-request', element: load(<CampaignRequestPage />) },
  { path: '/login', element: load(<LoginPage />) },
  { path: '/reset-password', element: load(<AccountPasswordPage />) },
  { path: '/activate-partner', element: load(<AccountPasswordPage />) },
  { element: <ProtectedRoute />, children: [
    { path: '/workspace', element: load(<WorkspacePage />) },
    { path: '/client/onboarding', element: load(<ClientOnboardingPage />) },
    { path: '/partner/register', element: load(<PartnerRegisterPage />) },
    { path: '/app', element: <WorkspaceEntryRedirect /> },
    { element: <WorkspaceGuard kind="client" />, children: [{ path: '/client', element: load(<ClientLayout />), children: [{ index: true, element: load(<WorkspaceDashboardPage kind="client" />) }, { path: '*', element: placeholder('Client operation page') }] }] },
    { element: <WorkspaceGuard kind="partner" />, children: [{ path: '/partner', element: load(<PartnerLayout />), children: [{ index: true, element: load(<WorkspaceDashboardPage kind="partner" />) }, { path: '*', element: placeholder('Partner operation page') }] }] },
    { element: <WorkspaceGuard kind="admin" />, children: [{ path: '/admin', element: load(<AdminLayout />), children: [{ index: true, element: load(<AdminDashboardPage />) }, { path: 'partner-applications', element: load(<PublicPartnerApplicationsPage />) }, { path: 'users', element: load(<UsersPage />) }, { path: 'settings', element: load(<AdminSettingsPage />) }, { path: '*', element: placeholder('Admin operation page') }] }] },
  ] },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export function AppRouter() { return <RouterProvider router={router} />; }



