export const apiQueryKeys = {
  workspaces: (userId: string) => ['api', 'me', 'workspaces', userId] as const,
  publicPartnerApplications: (status: string) => ['api', 'admin', 'public-partner-applications', status] as const,
  publicPartnerApplication: (applicationId: string) => ['api', 'admin', 'public-partner-applications', applicationId] as const,
};
