import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hasApiConfig } from '@/app/config/environment';
import { LoadingState } from '@/components/common/loading-state';
import { getPublicNetworkPartners, type PublicNetworkPartner } from '@/features/network/public-network-api';
import { formatNumber } from '@/lib/utils/format';

const tiers = ['Semua Tier', 'Mega', 'Macro', 'Mid', 'Micro', 'Nano'] as const;
const platforms = ['Semua Platform', 'Instagram', 'TikTok', 'YouTube', 'Website', 'X', 'Threads', 'Other'] as const;
const EMPTY_ROWS: PublicNetworkPartner[] = [];
const metricLabels: Record<string, string> = { followers: 'Followers', subscribers: 'Subscribers', members: 'Anggota', monthly_visitors: 'Pengunjung/bln', views: 'Views' };

export function PublicNetworkPreview() {
  const [query, setQuery] = useState('');
  const [activeTier, setActiveTier] = useState<(typeof tiers)[number]>('Semua Tier');
  const [activePlatform, setActivePlatform] = useState<(typeof platforms)[number]>('Semua Platform');
  const network = useQuery({ queryKey: ['public-network'], queryFn: getPublicNetworkPartners, enabled: hasApiConfig, staleTime: 60_000 });
  const rows = network.data ?? EMPTY_ROWS;
  const filteredRows = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return rows.filter((partner) => (!lowered || [partner.display_name, partner.handle ?? '', partner.niche ?? ''].some((value) => value.toLowerCase().includes(lowered))) && (activeTier === 'Semua Tier' || partner.tier === activeTier) && (activePlatform === 'Semua Platform' || partner.platform === activePlatform));
  }, [activePlatform, activeTier, query, rows]);
  const totalReach = rows.reduce((sum, partner) => sum + (partner.metric_value ?? 0), 0);

  return <section className="db-section" id="database"><div className="wrap"><div className="db-side reveal"><div className="section-head"><p className="eyebrow">NETWORK DATABASE — LIVE</p><h2>Cari langsung dari jaringan aktif</h2><p>Contoh potongan database publik Buzzerhood. Cari nama, handle, atau niche, lalu saring berdasarkan platform dan tier.</p></div><div className="photo-tile"><img src="https://images.pexels.com/photos/6770610/pexels-photo-6770610.jpeg?auto=compress&cs=tinysrgb&w=700" alt="Analitik performa jaringan" loading="lazy" /><span className="cap">Performance analytics</span></div></div><div className="db-toolbar"><label className="db-search"><span className="label">Search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, handle, niche..." /></label><div className="filter-group"><span>Tier</span><div className="field-chips">{tiers.map((tier) => <button className={tier === activeTier ? 'chip active' : 'chip'} key={tier} type="button" onClick={() => setActiveTier(tier)}>{tier}</button>)}</div></div><div className="filter-group"><span>Platform</span><div className="field-chips">{platforms.map((platform) => <button className={platform === activePlatform ? 'chip active' : 'chip'} key={platform} type="button" onClick={() => setActivePlatform(platform)}>{platform}</button>)}</div></div></div>{!hasApiConfig ? <p className="db-empty">API belum dikonfigurasi pada environment ini.</p> : null}{network.isLoading ? <LoadingState /> : null}{network.isError ? <p className="db-empty">Network database belum tersedia. Periksa API dan migration database.</p> : null}{network.isSuccess ? <><p className="db-meta"><strong>{formatNumber(filteredRows.length)}</strong> akun ditemukan dari <strong>{formatNumber(rows.length)}</strong> total di network database · Total metric: <strong>{formatNumber(totalReach)}</strong></p><div className="db-table-wrap"><table className="db-table"><thead><tr><th>Nama</th><th>Platform</th><th>Tier</th><th>Metric</th><th>Niche</th><th>Type</th></tr></thead><tbody>{filteredRows.slice(0, 60).map((partner: PublicNetworkPartner) => <tr key={partner.id}><td><strong>{partner.display_name}</strong><span>{partner.handle}</span></td><td>{partner.platform}</td><td><span className="tier-badge">{partner.tier}</span></td><td>{formatNumber(partner.metric_value ?? 0)} {partner.metric_type ? metricLabels[partner.metric_type] ?? partner.metric_type : ''}</td><td><span className="niche-tag">{partner.niche}</span></td><td><span className="partner-badge">{partner.partner_type}</span></td></tr>)}</tbody></table>{filteredRows.length === 0 ? <p className="db-empty">Tidak ada data yang cocok dengan filter.</p> : null}</div></> : null}</div></section>;
}


