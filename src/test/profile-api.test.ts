import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearAuthTokens, storeAuthTokens } from '@/lib/api/client';
import { getCurrentProfile } from '@/features/profile/profile-api';

describe('profile API', () => {
  afterEach(() => {
    clearAuthTokens();
    vi.unstubAllGlobals();
  });

  it('loads current profile through Backend Auth', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'user-id', profile: { displayName: 'User' } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    storeAuthTokens({ accessToken: 'test-token', csrfToken: 'test-csrf' });

    await expect(getCurrentProfile()).resolves.toEqual({ id: 'user-id', displayName: 'User', avatarPath: null });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:3100/api/v1/auth/me');
  });
});
