import { z } from 'zod';

export const publicCampaignRequestSchema = z.object({
  contactName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  whatsapp: z.string().trim().min(7).max(40).regex(/^[0-9+()\-\s]+$/),
  organizationName: z.string().trim().min(2).max(160),
  needType: z.enum(['brand_awareness','creator_activation','community_amplification','buzzer_network','other']),
  platformTarget: z.string().trim().min(2).max(500),
  brief: z.string().trim().min(10).max(5_000),
  sourcePath: z.enum(['/campaign-request','/partner/register-info']).default('/campaign-request'),
  website: z.string().trim().max(200).optional()
}).strict();
export const campaignRequestStatusSchema = z.object({ token: z.string().min(32).max(256) }).strict();
export type PublicCampaignRequestInput = z.infer<typeof publicCampaignRequestSchema>;
export type CampaignRequestStatusInput = z.infer<typeof campaignRequestStatusSchema>;
