import { z } from 'zod';
import { limitSchema, pageSchema, safeFilter } from '../../common/validation/query.schemas.js';
export const networkQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  platform: safeFilter.optional(), tier: safeFilter.optional(), niche: safeFilter.optional(),
  page: pageSchema, limit: limitSchema
}).strict();
export type NetworkQuery = z.infer<typeof networkQuerySchema>;
