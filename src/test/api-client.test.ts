import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Backend API client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    sessionStorage.clear();
  });

  it('serializes refresh and retries concurrent unauthorized requests once', async () => {
    sessionStorage.setItem('buzzerhood_csrf', 'csrf-old');
    let releaseRefresh: ((response: Response) => void) | undefined;
    const refreshResponse = new Promise<Response>((resolve) => { releaseRefresh = resolve; });
    let refreshCalls = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/auth/refresh')) {
        refreshCalls += 1;
        return refreshResponse;
      }
      const authorization = new Headers(init?.headers).get('Authorization');
      if (authorization === 'Bearer access-new') return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ error: { code: 'AUTH_INVALID_TOKEN', message: 'Expired' } }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const { apiRequest } = await import('@/lib/api/client');

    const first = apiRequest<{ ok: boolean }>('/me/workspaces');
    const second = apiRequest<{ ok: boolean }>('/auth/me');
    await Promise.resolve();
    await Promise.resolve();
    expect(refreshCalls).toBe(1);
    releaseRefresh?.(new Response(JSON.stringify({ accessToken: 'access-new', csrfToken: 'csrf-new' }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await expect(Promise.all([first, second])).resolves.toEqual([{ ok: true }, { ok: true }]);
    expect(sessionStorage.getItem('buzzerhood_csrf')).toBe('csrf-new');
    expect(refreshCalls).toBe(1);
  });
});
