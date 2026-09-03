import { environment } from '@/app/config/environment';

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

type NetworkResponse = { data: Array<{
  id: string;
  displayName: string;
  partnerType: string | null;
  tier: string | null;
  category: string | null;
  niche: string | null;
  platform: string;
  handle: string | null;
  metricType: string | null;
  metricValue: number | null;
  observedAt: string | null;
}> };

export async function getPublicNetworkPartners() {
  if (!environment.apiBaseUrl) throw new Error('VITE_API_BASE_URL belum dikonfigurasi.');
  const response = await fetch(`${environment.apiBaseUrl.replace(/\/$/, '')}/network?limit=100&page=1`, { credentials: 'include' });
  if (!response.ok) throw new Error(`Network API gagal (${response.status}).`);
  const payload = await response.json() as NetworkResponse;
  return payload.data.map((partner) => ({
    id: partner.id,
    display_name: partner.displayName,
    partner_type: partner.partnerType,
    tier: partner.tier,
    category: partner.category,
    niche: partner.niche,
    platform: partner.platform,
    handle: partner.handle,
    metric_type: partner.metricType,
    metric_value: partner.metricValue,
    observed_at: partner.observedAt,
  } satisfies PublicNetworkPartner));
}
