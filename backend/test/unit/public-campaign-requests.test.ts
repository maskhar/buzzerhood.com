import { describe, expect, it } from 'vitest';
import { publicCampaignRequestSchema } from '../../src/modules/public-campaign-requests/public-campaign-requests.schemas.js';

const valid = { contactName: 'Bimo Kharismantoro', email: 'bimo@example.com', whatsapp: '+628123456789', organizationName: 'Buzzerhood', needType: 'creator_activation', platformTarget: 'Instagram dan TikTok', brief: 'Campaign awareness produk baru selama satu bulan.', sourcePath: '/campaign-request' };
describe('public campaign request schema', () => {
  it('accepts complete campaign brief', () => { expect(publicCampaignRequestSchema.parse(valid)).toMatchObject(valid); });
  it('requires email and WhatsApp', () => { expect(() => publicCampaignRequestSchema.parse({ ...valid, email: '' })).toThrow(); expect(() => publicCampaignRequestSchema.parse({ ...valid, whatsapp: '' })).toThrow(); });
  it('rejects protected unknown fields', () => { expect(() => publicCampaignRequestSchema.parse({ ...valid, status: 'converted' })).toThrow(); });
});
