import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/use-auth';
import { getMyOrganizations, getOrganizationMembers } from '@/features/organizations/organization-api';
import { EmptyState } from '@/components/common/empty-state';
import { apiQueryKeys } from '@/lib/api/query-keys';

function useClientOrganization() {
  const { user } = useAuth();
  return useQuery({
    queryKey: user ? apiQueryKeys.organizations(user.id) : ['api', 'organizations', 'anonymous'],
    queryFn: getMyOrganizations,
    enabled: Boolean(user),
    select: (organizations) => organizations.find((organization) => organization.kind === 'client'),
  });
}

export function ClientOverviewPage() {
  const organization = useClientOrganization();
  if (organization.isPending) return <p>Memuat organisasi…</p>;
  if (!organization.data) return <EmptyState title="Belum ada organisasi client" description="Buat organisasi melalui Workspace." />;
  return <section><p className="eyebrow">CLIENT WORKSPACE</p><h1>{organization.data.name}</h1><div className="operational-grid"><article><span>Type</span><strong>{organization.data.kind}</strong></article><article><span>Role</span><strong>{organization.data.membershipRole}</strong></article><article><span>Status</span><strong>active</strong></article></div><EmptyState title="Campaign kosong" description="Campaign Engine belum diaktifkan." /></section>;
}

export function ClientTeamPage() {
  const organization = useClientOrganization();
  const team = useQuery({ queryKey: organization.data ? apiQueryKeys.organizationMembers(organization.data.id) : ['api', 'organizations', 'anonymous', 'members'], queryFn: () => getOrganizationMembers(organization.data?.id ?? ''), enabled: Boolean(organization.data) });
  if (organization.isPending) return <p>Memuat organisasi…</p>;
  if (!organization.data) return <EmptyState title="Belum ada organisasi client" description="Buat organisasi melalui Workspace." />;
  if (team.isPending) return <p>Memuat anggota…</p>;
  return <section><p className="eyebrow">CLIENT WORKSPACE</p><h1>Anggota {organization.data.name}</h1><div className="ops-list">{team.data?.map((member) => <article key={member.membershipId}><strong>{member.displayName ?? 'User'}</strong><span>{member.role} · {member.status}</span></article>)}</div><p className="muted">Undangan anggota akan tersedia pada fase berikutnya.</p></section>;
}
