import { z } from 'zod';
export const partnerApplicationSchema = z.object({
  kind: z.enum(['individual','organization']),
  displayName: z.string().trim().min(2).max(160),
  partnerType: z.string().trim().max(80).optional(), category: z.string().trim().max(80).optional(),
  niche: z.string().trim().max(80).optional(), location: z.string().trim().max(160).optional(),
  bio: z.string().trim().max(2000).optional()
}).strict();
export const partnerClaimSchema = z.object({ partnerId: z.string().uuid(), evidence: z.string().trim().min(20).max(4000) }).strict();
export type PartnerApplicationInput = z.infer<typeof partnerApplicationSchema>;
export type PartnerClaimInput = z.infer<typeof partnerClaimSchema>;
