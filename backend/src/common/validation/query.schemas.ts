import { z } from 'zod';

export const pageSchema = z.coerce.number().int().min(1).max(100_000).default(1);
export const limitSchema = z.coerce.number().int().min(1).max(100).default(20);
export const safeFilter = z.string().trim().min(1).max(80).regex(/^[\p{L}\p{N} ._+&/'-]+$/u);
export const listQuerySchema = z.object({ page: pageSchema, limit: limitSchema }).strict();
