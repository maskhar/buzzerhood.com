import { getBuzzerhoodDb } from '@/lib/supabase/client';

export type PublicNetworkPartner = {
  id: string;
  display_name: string;
  partner_type: string | null;
  tier: string | null;
  category: string | null;
  niche: string | null;
  platform: string;
  handle: string | null;
  metric_type: string | null;
  metric_value: number | null;
  observed_at: string | null;
};

export async function getPublicNetworkPartners() {
  const { data, error } = await getBuzzerhoodDb()
    .from('public_network_partners')
    .select('id, display_name, partner_type, tier, category, niche, platform, handle, metric_type, metric_value, observed_at')
    .order('display_name');
  if (error) throw error;
  return data as PublicNetworkPartner[];
}
