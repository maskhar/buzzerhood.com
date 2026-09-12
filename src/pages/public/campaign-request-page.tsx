import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import buzzerhoodLogo from '@/assets/images/buzzerhood-logo-02.png';
import campaignBackground from '@/assets/images/campaign-request-bg.png';
import './campaign-request-page.css';
import { createPublicCampaignRequest, type PublicCampaignRequestInput } from '@/features/campaigns/public-campaign-request-api';
import { apiErrorMessage } from '@/lib/api/errors';

const requestSchema = z.object({
  name: z.string().min(2, 'Masukkan nama.'), email: z.string().email('Masukkan email valid.'), whatsapp: z.string().min(7, 'Masukkan WhatsApp valid.').regex(/^[0-9+()\-\s]+$/, 'Masukkan WhatsApp valid.'), company: z.string().min(2, 'Masukkan organisasi.'),
  need: z.string().min(1, 'Pilih jenis kebutuhan.'), platform: z.string().min(2, 'Masukkan platform atau target campaign.'), message: z.string().min(10, 'Ceritakan kebutuhan campaign.'),
});
type RequestValues = z.infer<typeof requestSchema>;
const services = [
  ['megaphone', 'Brand Awareness', 'Perluas jangkauan brand Anda secara masif.'], ['people', 'Creator Activation', 'Kolaborasi dengan creator, KOL, dan influencer relevan.'],
  ['community', 'Community Amplification', 'Gerakkan komunitas untuk dukungan yang lebih kuat.'], ['network', 'Buzzer Network', 'Sebarkan narasi positif melalui jaringan buzzer kami.'],
] as const;

function Icon({ name }: { name: string }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  if (name === 'megaphone') return <svg {...common}><path d="m3 11 17-6v12L3 13z"/><path d="M11.6 16.1 13 21H8l-1.7-6"/><path d="M20 9a3 3 0 0 1 0 4"/></svg>;
  if (name === 'people') return <svg {...common}><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20v-2a5.5 5.5 0 0 1 11 0v2"/><path d="M14 14.5a4.5 4.5 0 0 1 7.5 3.5v2"/></svg>;
  if (name === 'community') return <svg {...common}><circle cx="12" cy="7" r="3"/><circle cx="5" cy="10" r="2.5"/><circle cx="19" cy="10" r="2.5"/><path d="M7 21v-2a5 5 0 0 1 10 0v2"/><path d="M1 20v-1.5A4.5 4.5 0 0 1 6 14"/><path d="M23 20v-1.5a4.5 4.5 0 0 0-5-4.5"/></svg>;
  if (name === 'network') return <svg {...common}><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/></svg>;
  if (name === 'mail') return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>;
  if (name === 'phone') return <svg {...common}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c1 .3 1.9.6 2.9.7a2 2 0 0 1 1.6 1.9z"/></svg>;
  if (name === 'building') return <svg {...common}><path d="M4 21V4h10v17M14 9h6v12M8 8h2M8 12h2M8 16h2M17 13h1M17 17h1"/></svg>;
  if (name === 'list') return <svg {...common}><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/></svg>;
  if (name === 'target') return <svg {...common}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="m15 9 6-6M17 3h4v4"/></svg>;
  if (name === 'file') return <svg {...common}><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/></svg>;
  if (name === 'send') return <svg {...common}><path d="m22 2-7 20-4-9-9-4zM22 2 11 13"/></svg>;
  return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
}

export function CampaignRequestPage({ partner }: { partner?: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<RequestValues>({ resolver: zodResolver(requestSchema) });
  const [submitting, setSubmitting] = useState(false); const [message, setMessage] = useState('');
  async function submit(values: RequestValues) { setSubmitting(true); setMessage(''); try { await createPublicCampaignRequest({ contactName: values.name, email: values.email, whatsapp: values.whatsapp, organizationName: values.company, needType: values.need as PublicCampaignRequestInput['needType'], platformTarget: values.platform, brief: values.message, sourcePath: '/campaign-request' }); setMessage('Brief berhasil dikirim. Cek email Anda untuk tautan status.'); } catch (error) { setMessage(apiErrorMessage(error, 'Brief gagal dikirim. Coba lagi beberapa saat.')); } finally { setSubmitting(false); } }
  const title = partner ? <>Form Pendaftaran <span>Partner</span></> : <>Form Permintaan <span>Campaign</span></>;
  return <main className="campaign-request" style={{ '--campaign-bg': 'url(' + campaignBackground + ')' } as React.CSSProperties}>
    <header className="campaign-request-nav"><Link to="/home-02" aria-label="Buzzerhood — kembali ke beranda"><img src={buzzerhoodLogo} alt="Buzzerhood" /></Link><nav aria-label="Navigasi utama"><Link to="/home-02">Beranda</Link><Link to="/home-02#layanan">Layanan</Link><Link to="/home-02#studi-kasus">Studi Kasus</Link><Link to="/home-02#tentang">Tentang Kami</Link><Link to="/home-02#kontak">Kontak</Link></nav><Link className="campaign-nav-cta" to="/campaign-request">Ajukan Campaign <span>→</span></Link></header>
    <div className="campaign-request-layout"><section className="campaign-request-intro"><p className="campaign-request-kicker">Ideas&nbsp;&nbsp; People&nbsp;&nbsp; Impact</p><h1>Diskusikan <span>Campaign</span> Brand Anda</h1><p className="campaign-request-lead">Buzzerhood membantu brand, perusahaan, dan organisasi membangun <strong>awareness</strong>, <strong>engagement</strong>, dan <strong>dampak nyata</strong> melalui kekuatan creator, komunitas, dan kampanye buzz yang terukur.</p><div className="campaign-service-grid">{services.map(([icon, serviceTitle, copy]) => <article key={serviceTitle}><span className="campaign-service-icon"><Icon name={icon} /></span><div><h2>{serviceTitle}</h2><p>{copy}</p></div></article>)}</div><p className="campaign-request-script">Dari Ide,<br />Jadi Dampak.</p></section>
      <section className="campaign-request-card"><p className="campaign-form-kicker">Public Form</p><h2>{title}</h2><p className="campaign-form-copy">Isi brief singkat Anda, tim kami akan segera menghubungi Anda.</p><form onSubmit={handleSubmit(submit)} noValidate>
        <label>Nama Lengkap<div className="campaign-field"><Icon name="user" /><input autoComplete="name" placeholder="Nama lengkap Anda" {...register('name')} /></div></label>{errors.name ? <small>{errors.name.message}</small> : null}
        <label>Email<div className="campaign-field"><Icon name="mail" /><input type="email" autoComplete="email" placeholder="nama@perusahaan.com" {...register('email')} /></div></label>{errors.email ? <small>{errors.email.message}</small> : null}
        <label>WhatsApp<div className="campaign-field"><Icon name="phone" /><input inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxx" {...register('whatsapp')} /></div></label>{errors.whatsapp ? <small>{errors.whatsapp.message}</small> : null}
        <label>{partner ? 'Organisasi / Nama Channel' : 'Perusahaan / Brand / Organisasi'}<div className="campaign-field"><Icon name="building" /><input autoComplete="organization" placeholder={partner ? 'Nama organisasi atau channel Anda' : 'Nama perusahaan atau brand Anda'} {...register('company')} /></div></label>{errors.company ? <small>{errors.company.message}</small> : null}
        <label>Jenis Kebutuhan<div className="campaign-field"><Icon name="list" /><select defaultValue="" {...register('need')}><option value="" disabled>Pilih jenis kebutuhan</option><option value="brand_awareness">Brand Awareness</option><option value="creator_activation">Creator Activation</option><option value="community_amplification">Community Amplification</option><option value="buzzer_network">Buzzer Network</option><option value="other">Lainnya</option></select></div></label>{errors.need ? <small>{errors.need.message}</small> : null}
        <label>Platform / Target Campaign<div className="campaign-field"><Icon name="target" /><input placeholder="Contoh: Instagram, TikTok, YouTube, dll" {...register('platform')} /></div></label>{errors.platform ? <small>{errors.platform.message}</small> : null}
        <label>Ceritakan kebutuhan Anda<div className="campaign-field campaign-textarea"><Icon name="file" /><textarea rows={3} placeholder="Jelaskan detail campaign, tujuan, timeline, dll." {...register('message')} /></div></label>{errors.message ? <small>{errors.message.message}</small> : null}
        <button className="campaign-submit" disabled={submitting} type="submit"><Icon name="send" />{submitting ? 'Mengirim…' : 'Kirim Brief Campaign'}</button>{message ? <p className="campaign-form-message" role="status">{message}</p> : null}
      </form><p className="campaign-form-note">◇&nbsp; Untuk brand, agency, organisasi, event, dan campaign kolaboratif.</p></section></div>
    <footer className="campaign-request-stats" aria-label="Statistik jaringan Buzzerhood"><div><strong>500+</strong><span>Creator & KOL<br />Network</span></div><div><strong>100+</strong><span>Brand & Agency<br />Partner</span></div><div><strong>1000+</strong><span>Campaign<br />Kolaborasi</span></div><div><strong>Indonesia</strong><span>Lebih banyak<br />dampak positif</span></div><p>Good People<br />Good Impact</p></footer>
  </main>;
}
