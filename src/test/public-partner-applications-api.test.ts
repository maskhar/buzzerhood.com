import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearAuthTokens, storeAuthTokens } from '@/lib/api/client';
import { invitePublicPartnerApplication, reviewPublicPartnerApplication } from '@/features/admin/public-partner-applications-api';

describe('public partner application API', () => {
  afterEach(() => {
    clearAuthTokens();
    vi.unstubAllGlobals();
  });

  it('maps approved and rejected decisions to Backend action routes', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ id: 'application-id', status: 'approved' }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
    vi.stubGlobal('fetch', fetchMock);
    storeAuthTokens({ accessToken: 'test-token', csrfToken: 'test-csrf' });

    await reviewPublicPartnerApplication('application-id', 'approved', 'Looks good');
    await reviewPublicPartnerApplication('application-id', 'rejected', 'Incomplete');

    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:3100/api/v1/admin/public-partner-applications/application-id/approve');
    expect(fetchMock.mock.calls[1]?.[0]).toBe('http://localhost:3100/api/v1/admin/public-partner-applications/application-id/reject');

    await invitePublicPartnerApplication('application-id');
    expect(fetchMock.mock.calls[2]?.[0]).toBe('http://localhost:3100/api/v1/admin/public-partner-applications/application-id/invite');
    expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({ method: 'POST' });
  });
});
