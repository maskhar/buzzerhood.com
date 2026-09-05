import { z } from 'zod';

const valueSchema = z.string().trim().min(1).max(500);

export const publicPartnerApplicationSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254),
  whatsapp: z.string().trim().min(7).max(40).regex(/^[0-9+()\-\s]+$/),
  city: z.string().trim().min(2).max(160),
  category: z.enum(['media', 'influencer', 'komunitas', 'buzzer']),
  message: z.string().trim().max(2_000).optional(),
  details: z.record(z.string().min(1).max(80), z.union([valueSchema, z.array(valueSchema).min(1).max(20)])).superRefine((value, context) => {
    if (Object.keys(value).length > 30) context.addIssue({ code: 'custom', message: 'Terlalu banyak detail.' });
  }),
  consent: z.literal(true),
  website: z.string().trim().max(200).optional()
}).strict();

export type PublicPartnerApplicationInput = z.infer<typeof publicPartnerApplicationSchema>;
