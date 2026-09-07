export const apiQueryKeys = {
  profile: (userId: string) => ['api', 'auth', 'profile', userId] as const,
  organizations: (userId: string) => ['api', 'organizations', userId] as const,
  organizationMembers: (organizationId: string) => ['api', 'organizations', organizationId, 'members'] as const,
  workspaces: (userId: string) => ['api', 'me', 'workspaces', userId] as const,
  publicPartnerApplications: (status: string) => ['api', 'admin', 'public-partner-applications', status] as const,
  publicPartnerApplication: (applicationId: string) => ['api', 'admin', 'public-partner-applications', applicationId] as const,
};
