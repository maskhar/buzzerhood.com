import { NavLink, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/features/auth/use-auth';

type DashboardLayoutProps = { title: string; links: { to: string; label: string }[]; children?: ReactNode };
function DashboardLayout({ title, links, children }: DashboardLayoutProps) {
  const { signOut } = useAuth();
  return <div className="dashboard"><aside className="dashboard-sidebar"><NavLink className="dashboard-brand" to="/">BUZZER<span>HOOD</span></NavLink><p>{title}</p><nav aria-label={`${title} navigation`}>{links.map((link) => <NavLink key={link.to} to={link.to}>{link.label}</NavLink>)}</nav></aside><div className="dashboard-content"><header><span>Development shell</span><div className="dashboard-actions"><NavLink to="/workspace">Workspace</NavLink><button type="button" onClick={() => void signOut()}>Keluar</button></div></header><main>{children ?? <Outlet />}</main></div></div>;
}
export function ClientLayout() { return <DashboardLayout title="Client workspace" links={[{ to: '/client', label: 'Dashboard' }]} />; }
export function PartnerLayout() { return <DashboardLayout title="Partner workspace" links={[{ to: '/partner', label: 'Dashboard' }]} />; }
export function AdminLayout() { return <DashboardLayout title="Admin workspace" links={[{ to: '/admin', label: 'Dashboard' }, { to: '/admin/partner-applications', label: 'Program Partner' }]} />; }
