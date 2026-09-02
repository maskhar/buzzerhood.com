import type { OrganizationMembership } from '@/features/auth/auth-types';

export async function getMyOrganizationMemberships(userId: string): Promise<OrganizationMembership[]> {
  const { getBuzzerhoodDb } = await import('@/lib/supabase/client');
  const { data, error } = await getBuzzerhoodDb()
    .from('organization_members')
    .select('id, organization_id, profile_id, role, status, organizations(id, name, slug, kind)')
    .eq('profile_id', userId)
    .eq('status', 'active');
  if (error) throw error;
  return (data ?? []) as unknown as OrganizationMembership[];
}
