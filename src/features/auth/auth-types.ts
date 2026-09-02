export type Profile = {
  id: string;
  display_name: string | null;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
};

export type OrganizationKind = 'client' | 'partner' | 'internal';
export type MembershipRole = 'member' | 'manager' | 'owner';
export type MembershipStatus = 'invited' | 'active' | 'suspended' | 'removed';

export type OrganizationMembership = {
  id: string;
  organization_id: string;
  profile_id: string;
  role: MembershipRole;
  status: MembershipStatus;
  organizations: { id: string; name: string; slug: string; kind: OrganizationKind } | null;
};

export type WorkspaceKind = 'client' | 'partner' | 'admin';
export type WorkspaceAccess = { kind: WorkspaceKind; organizationId?: string; organizationName?: string };
