import { createClient } from '@supabase/supabase-js';
import { environment, hasSupabaseConfig } from '@/app/config/environment';
import type { Database } from '@/lib/supabase/database.types';

let client: ReturnType<typeof createClient<Database>> | undefined;

export function getSupabaseClient() {
  if (!hasSupabaseConfig || !environment.supabaseUrl || !environment.supabaseAnonKey) {
    throw new Error('Supabase is not configured. Add required VITE_SUPABASE variables to local .env.');
  }
  client ??= createClient<Database>(environment.supabaseUrl, environment.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}

export function getBuzzerhoodDb() {
  return getSupabaseClient().schema('buzzerhood');
}

