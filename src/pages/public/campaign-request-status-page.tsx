import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getPublicCampaignRequestStatus } from '@/features/campaigns/public-campaign-request-api';
import { apiErrorMessage } from '@/lib/api/errors';

const labels: Record<string,string> = { new: 'Brief diterima', in_review: 'Sedang ditinjau', rejected: 'Belum dapat diproses', archived: 'Permintaan diarsipkan', converted: 'Campaign telah dibuat' };
export function CampaignRequestStatusPage() {
  const [params] = useSearchParams(); const token=params.get('token'); const [message,setMessage]=useState(token ? 'Memeriksa status…' : 'Token status tidak tersedia.');
  useEffect(() => { if (!token) return; void getPublicCampaignRequestStatus(token).then(result => setMessage(labels[result.status] ?? 'Status tersedia.')).catch(error => setMessage(apiErrorMessage(error,'Status tidak dapat diperiksa.'))); }, [token]);
  return <main className="auth-page"><section className="auth-card"><p className="eyebrow">CAMPAIGN REQUEST</p><h1>Status Brief</h1><p role="status">{message}</p><Link className="btn-solid" to="/campaign-request">Kembali ke form</Link></section></main>;
}
