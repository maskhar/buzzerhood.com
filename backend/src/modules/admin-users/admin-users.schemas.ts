import { z } from 'zod';
export const createAdminUserSchema=z.object({email:z.string().trim().email().max(254),displayName:z.string().trim().min(1).max(120),role:z.enum(['internal_team','admin','super_admin'])}).strict();
export type CreateAdminUserInput=z.infer<typeof createAdminUserSchema>;
