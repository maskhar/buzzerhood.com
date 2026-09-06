import { NavLink, Outlet } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import { useAuth } from '@/features/auth/use-auth';

type DashboardLayoutProps = { title: string; links: { to: string; label: string }[]; children?: ReactNode };
function DashboardLayout({ title, links, children }: DashboardLayoutProps) {
  const { signOut } = useAuth();
  const [navigationOpen, setNavigationOpen] = useState(false);
  return <div className="dashboard"><aside className={`dashboard-sidebar ${navigationOpen ? 'is-open' : ''}`}><div className="dashboard-sidebar-heading"><NavLink className="dashboard-brand" to="/">BUZZER<span>HOOD</span></NavLink><button className="dashboard-menu-toggle" type="button" aria-expanded={navigationOpen} aria-controls="dashboard-navigation" onClick={() => setNavigationOpen((open) => !open)}>{navigationOpen ? 'Tutup menu' : 'Menu'}</button></div><p>{title}</p><nav id="dashboard-navigation" aria-label={`${title} navigation`}>{links.map((link) => <NavLink end={link.to === '/admin' || link.to === '/client' || link.to === '/partner'} key={link.to} to={link.to} onClick={() => setNavigationOpen(false)}>{link.label}</NavLink>)}</nav></aside><div className="dashboard-content"><header><div className="dashboard-header-label"><span>Admin Console</span><small>Semua akses dilindungi Backend API</small></div><div className="dashboard-actions"><NavLink to="/workspace">Workspace</NavLink><button type="button" onClick={() => void signOut()}>Keluar</button></div></header><main>{children ?? <Outlet />}</main></div></div>;
}
export function ClientLayout() { return <DashboardLayout title="Client workspace" links={[{ to: '/client', label: 'Dashboard' }]} />; }
export function PartnerLayout() { return <DashboardLayout title="Partner workspace" links={[{ to: '/partner', label: 'Dashboard' }]} />; }
export function AdminLayout() { return <DashboardLayout title="Admin workspace" links={[{ to: '/admin', label: 'Dashboard' }, { to: '/admin/partner-applications', label: 'Program Partner' }, { to: '/admin/users', label: 'Users' }, { to: '/admin/settings', label: 'Settings' }]} />; }
