import { z } from 'zod';

export const adminRoleSchema = z.enum(['internal_team','admin','super_admin']);
export const createAdminUserSchema = z.object({ email: z.string().trim().email().max(254), displayName: z.string().trim().min(1).max(120), role: adminRoleSchema }).strict();
export const updateAdminUserRoleSchema = z.object({ role: adminRoleSchema }).strict();

export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
export type UpdateAdminUserRoleInput = z.infer<typeof updateAdminUserRoleSchema>;
