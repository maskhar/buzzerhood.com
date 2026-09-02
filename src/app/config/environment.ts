import { z } from 'zod';

const optionalUrl = z.string().url().optional();
const optionalAnonKey = z.string().min(1).optional();

const parsed = z.object({
  VITE_SUPABASE_URL: optionalUrl,
  VITE_SUPABASE_ANON_KEY: optionalAnonKey,
}).parse(import.meta.env);

export const environment = {
  supabaseUrl: parsed.VITE_SUPABASE_URL,
  supabaseAnonKey: parsed.VITE_SUPABASE_ANON_KEY,
};

export const hasSupabaseConfig = Boolean(environment.supabaseUrl && environment.supabaseAnonKey);

export const missingSupabaseVariables = [
  !environment.supabaseUrl ? 'VITE_SUPABASE_URL' : null,
  !environment.supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY' : null,
].filter((value): value is string => value !== null);
