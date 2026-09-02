export const queryKeys = {
  profile: (userId: string) => ['auth', 'profile', userId] as const,
  organizations: (userId: string) => ['organizations', 'mine', userId] as const,
  workspaces: (userId: string) => ['workspaces', userId] as const,
};
