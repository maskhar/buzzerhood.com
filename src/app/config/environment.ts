import { z } from 'zod';

const parsed = z.object({
  VITE_API_BASE_URL: z.string().url().optional(),
}).parse(import.meta.env);

export const environment = {
  apiBaseUrl: parsed.VITE_API_BASE_URL,
};

export const hasApiConfig = Boolean(environment.apiBaseUrl);

export const missingApiVariables = [
  !environment.apiBaseUrl ? 'VITE_API_BASE_URL' : null,
].filter((value): value is string => value !== null);
