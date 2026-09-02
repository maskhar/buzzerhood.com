import { NavLink, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/features/auth/use-auth';

type DashboardLayoutProps = { title: string; links: { to: string; label: string }[]; children?: ReactNode };
function DashboardLayout({ title, links, children }: DashboardLayoutProps) {
  const { signOut } = useAuth();
  return <div className="dashboard"><aside className="dashboard-sidebar"><NavLink className="dashboard-brand" to="/">BUZZER<span>HOOD</span></NavLink><p>{title}</p><nav aria-label={`${title} navigation`}>{links.map((link) => <NavLink key={link.to} to={link.to}>{link.label}</NavLink>)}</nav></aside><div className="dashboard-content"><header><span>Development shell</span><div className="dashboard-actions"><NavLink to="/workspace">Workspace</NavLink><button type="button" onClick={() => void signOut()}>Keluar</button></div></header><main>{children ?? <Outlet />}</main></div></div>;
}
export function ClientLayout() { return <DashboardLayout title="Client workspace" links={[{ to: '/client', label: 'Dashboard' }, { to: '/client/campaigns', label: 'Campaigns' }, { to: '/client/reports', label: 'Reports' }, { to: '/client/billing', label: 'Billing' }, { to: '/client/team', label: 'Team' }]} />; }
export function PartnerLayout() { return <DashboardLayout title="Partner workspace" links={[{ to: '/partner', label: 'Dashboard' }, { to: '/partner/profile', label: 'Profile' }, { to: '/partner/platforms', label: 'Platforms' }, { to: '/partner/rates', label: 'Rate card' }, { to: '/partner/campaigns', label: 'Campaigns' }, { to: '/partner/earnings', label: 'Earnings' }]} />; }
export function AdminLayout() { return <DashboardLayout title="Admin workspace" links={[{ to: '/admin', label: 'Dashboard' }, { to: '/admin/clients', label: 'Clients' }, { to: '/admin/partners', label: 'Partners' }, { to: '/admin/campaigns', label: 'Campaigns' }, { to: '/admin/reports', label: 'Reports' }, { to: '/admin/billing', label: 'Billing' }, { to: '/admin/users', label: 'Users' }, { to: '/admin/settings', label: 'Settings' }]} />; }
