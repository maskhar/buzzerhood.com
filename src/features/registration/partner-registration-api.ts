import { environment } from '@/app/config/environment';

export type PublicPartnerApplication = {
  fullName: string;
  email: string;
  whatsapp: string;
  city: string;
  category: 'media' | 'influencer' | 'komunitas' | 'buzzer';
  message?: string;
  details: Record<string, string | string[]>;
  consent: true;
  website?: string;
};

export async function createPublicPartnerApplication(input: PublicPartnerApplication): Promise<void> {
  if (!environment.apiBaseUrl) throw new Error('Pendaftaran belum tersedia. Silakan hubungi tim Buzzerhood.');
  const endpoint = environment.apiBaseUrl.replace(/\/$/, '') + '/public/partner-applications';
  const response = await fetch(endpoint, {
    method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input)
  });
  if (response.ok) return;
  const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
  throw new Error(payload?.error?.message ?? 'Pendaftaran gagal dikirim. Coba lagi beberapa saat.');
}
