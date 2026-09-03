import { describe, expect, it } from 'vitest';
import { ApiError, type ApiErrorBody } from '../../src/common/errors/api-error.js';
import { conflictFromDatabase } from '../../src/common/errors/postgres-error.js';
import { networkQuerySchema } from '../../src/modules/network/network.schemas.js';
import { toPublicPartner, type PublicRow } from '../../src/modules/network/network.service.js';
import { partnerUpdateSchema, platformCreateSchema, rateCreateSchema } from '../../src/modules/partners/partners.schemas.js';

describe('B2 request boundaries and response shaping', () => {
  it('applies bounded pagination defaults and rejects unknown filters', () => {
    expect(networkQuerySchema.parse({})).toMatchObject({ page: 1, limit: 20 });
    expect(networkQuerySchema.safeParse({ limit: '101' }).success).toBe(false);
    expect(networkQuerySchema.safeParse({ page: '1', secret: 'x' }).success).toBe(false);
  });

  it('rejects protected Partner fields and normalizes constrained values', () => {
    expect(partnerUpdateSchema.safeParse({ verificationStatus: 'approved' }).success).toBe(false);
    expect(platformCreateSchema.safeParse({ platform: 'Instagram', profileUrl: 'javascript:alert(1)' }).success).toBe(false);
    expect(rateCreateSchema.parse({ serviceType: 'Post', amount: '1500000', currency: 'idr' })).toMatchObject({ amount: 1_500_000, currency: 'IDR' });
  });

  it('maps the public projection without private or operational fields', () => {
    const row: PublicRow = { id: 'partner-1', display_name: 'Creator', partner_type: 'Influencer', tier: 'A', category: 'Lifestyle', niche: 'Travel', platform: 'Instagram', handle: '@creator', metric_type: 'followers', metric_value: '1200', observed_at: null };
    const result = toPublicPartner(row);
    expect(result.metricValue).toBe(1200);
    expect(result).not.toHaveProperty('rate');
    expect(result).not.toHaveProperty('evidence');
    expect(result).not.toHaveProperty('membership');
  });

  it('translates only known database conflicts and preserves unknown failures', () => {
    try { conflictFromDatabase({ code: '23505', message: 'duplicate' }, 'DUPLICATE', 'Already exists.'); }
    catch (error: unknown) { expect(error).toBeInstanceOf(ApiError); expect((error as ApiError).getResponse()).toMatchObject({ error: { code: 'DUPLICATE', message: 'Already exists.' } } satisfies Partial<ApiErrorBody>); }
    const failure = new Error('connection lost');
    expect(() => conflictFromDatabase(failure, 'CONFLICT', 'Conflict.')).toThrow(failure);
  });
});
