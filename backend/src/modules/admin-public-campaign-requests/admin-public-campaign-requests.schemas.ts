import { z } from 'zod';
export const adminCampaignRequestQuerySchema = z.object({ status: z.enum(['new','in_review','rejected','archived','converted']).optional(), page: z.coerce.number().int().min(1).max(10_000).default(1), limit: z.coerce.number().int().min(1).max(100).default(25) }).strict();
export const campaignRequestReviewSchema = z.object({ note: z.string().trim().max(2_000).optional() }).strict();
export type AdminCampaignRequestQuery = z.infer<typeof adminCampaignRequestQuerySchema>;
export type CampaignRequestReview = z.infer<typeof campaignRequestReviewSchema>;
