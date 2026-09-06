import { z } from 'zod';

export const emailTestSchema = z.object({ recipient: z.string().trim().email().max(254) }).strict();
export type EmailTestInput = z.infer<typeof emailTestSchema>;
