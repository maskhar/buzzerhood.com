import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Masukkan email yang valid.'),
  password: z.string().min(8, 'Password minimal 8 karakter.'),
});

export type LoginValues = z.infer<typeof loginSchema>;
