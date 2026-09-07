import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearAuthTokens, storeAuthTokens } from '@/lib/api/client';
import { getMyOrganizations, getOrganizationMembers } from '@/features/organizations/organization-api';

describe('organization API', () => {
  afterEach(() => {
    clearAuthTokens();
    vi.unstubAllGlobals();
  });

  it('uses Backend routes for organization and member reads', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })));
    vi.stubGlobal('fetch', fetchMock);
    storeAuthTokens({ accessToken: 'test-token', csrfToken: 'test-csrf' });

    await getMyOrganizations();
    await getOrganizationMembers('organization-id');

    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:3100/api/v1/organizations');
    expect(fetchMock.mock.calls[1]?.[0]).toBe('http://localhost:3100/api/v1/organizations/organization-id/members');
  });
});
