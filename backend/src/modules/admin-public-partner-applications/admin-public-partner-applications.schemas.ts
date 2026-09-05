import { z } from 'zod';

export const adminPublicPartnerApplicationQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25)
}).strict();

export const publicPartnerApplicationReviewSchema = z.object({
  note: z.string().trim().max(2_000).optional()
}).strict();

export type AdminPublicPartnerApplicationQuery = z.infer<typeof adminPublicPartnerApplicationQuerySchema>;
export type PublicPartnerApplicationReview = z.infer<typeof publicPartnerApplicationReviewSchema>;
