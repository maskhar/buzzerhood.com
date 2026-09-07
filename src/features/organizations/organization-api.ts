import type { MembershipRole, MembershipStatus, OrganizationKind } from '@/features/auth/auth-types';
import { apiRequest } from '@/lib/api/client';

export type Organization = { id: string; name: string; slug: string; kind: OrganizationKind; membershipRole: MembershipRole };
export type OrganizationMember = { membershipId: string; displayName: string | null; role: MembershipRole; status: MembershipStatus };

export function getMyOrganizations() {
  return apiRequest<Organization[]>('/organizations');
}

export function getOrganizationMembers(organizationId: string) {
  return apiRequest<OrganizationMember[]>('/organizations/' + organizationId + '/members');
}
