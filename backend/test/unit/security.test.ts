import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { AppConfiguration } from '../../src/common/config/configuration.js';
import { PasswordService } from '../../src/common/security/password.service.js';
import { TokenService } from '../../src/common/security/token.service.js';
import { REDACT_PATHS, requestIdFromHeader } from '../../src/common/logging/logging.js';

function tokenService(ttl = 600): TokenService {
  const pair = generateKeyPairSync('ed25519');
  const config = {
    jwt: {
      issuer: 'https://auth.test.buzzerhood.invalid', audience: 'buzzerhood-test', accessTtlSeconds: ttl, keyId: 'test-1',
      privateKeyPem: pair.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString(),
      publicKeyPem: pair.publicKey.export({ format: 'pem', type: 'spki' }).toString()
    }
  } as AppConfiguration;
  return new TokenService(config);
}

describe('authentication primitives', () => {
  it('hashes and verifies passwords with Argon2id', async () => {
    const service = new PasswordService(); const value = 'a long test password';
    const digest = await service.hash(value);
    expect(digest).toMatch(/^\$argon2id\$/); expect(digest).not.toContain(value);
    await expect(service.verify(digest, value)).resolves.toBe(true);
    await expect(service.verify(digest, 'incorrect password')).resolves.toBe(false);
  });
  it('signs and strictly verifies EdDSA access tokens', async () => {
    const service = tokenService(); const token = await service.issueAccess('5a2a5e76-9092-4c96-9d10-2d2f8b976dd9');
    const identity = await service.verifyAccess(token);
    expect(identity.userId).toBe('5a2a5e76-9092-4c96-9d10-2d2f8b976dd9'); expect(identity.jti).toBeTruthy();
    await expect(service.verifyAccess(`${token}x`)).rejects.toMatchObject({ response: { error: { code: 'AUTH_INVALID_TOKEN' } } });
  });
  it('rejects expired access tokens', async () => {
    const service = tokenService(-1); const token = await service.issueAccess('5a2a5e76-9092-4c96-9d10-2d2f8b976dd9');
    await expect(service.verifyAccess(token)).rejects.toMatchObject({ response: { error: { code: 'AUTH_INVALID_TOKEN' } } });
  });
  it('creates high-entropy refresh tokens and deterministic non-plaintext digests', () => {
    const service = tokenService(); const first = service.createRefresh(); const second = service.createRefresh();
    expect(first.token).not.toBe(second.token); expect(first.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.hash).toBe(service.hashRefresh(first.token)); expect(first.hash).not.toContain(first.token);
  });
  it('redacts sensitive log paths and validates propagated request ids', () => {
    expect(REDACT_PATHS).toContain('req.headers.authorization'); expect(REDACT_PATHS).toContain('req.body.password');
    expect(requestIdFromHeader('trace_123')).toBe('trace_123'); expect(requestIdFromHeader('invalid id with spaces')).not.toBe('invalid id with spaces');
  });
});
