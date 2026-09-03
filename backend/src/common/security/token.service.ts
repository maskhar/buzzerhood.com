import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { importPKCS8, importSPKI, jwtVerify, SignJWT } from 'jose';
import { APP_CONFIGURATION } from '../config/configuration.module.js';
import type { AppConfiguration } from '../config/configuration.js';
import { ApiError } from '../errors/api-error.js';

export type AccessIdentity = { userId: string; jti: string; issuedAt: number };

@Injectable()
export class TokenService {
  private readonly privateKey: ReturnType<typeof importPKCS8>;
  private readonly publicKey: ReturnType<typeof importSPKI>;
  constructor(@Inject(APP_CONFIGURATION) private readonly config: AppConfiguration) {
    this.privateKey = importPKCS8(config.jwt.privateKeyPem, 'EdDSA');
    this.publicKey = importSPKI(config.jwt.publicKeyPem, 'EdDSA');
  }
  async issueAccess(userId: string): Promise<string> {
    return new SignJWT({}).setProtectedHeader({ alg: 'EdDSA', typ: 'JWT', kid: this.config.jwt.keyId })
      .setSubject(userId).setJti(randomUUID()).setIssuer(this.config.jwt.issuer)
      .setAudience(this.config.jwt.audience).setIssuedAt()
      .setExpirationTime(`${this.config.jwt.accessTtlSeconds}s`).sign(await this.privateKey);
  }
  async verifyAccess(token: string): Promise<AccessIdentity> {
    try {
      const result = await jwtVerify(token, await this.publicKey, {
        algorithms: ['EdDSA'], issuer: this.config.jwt.issuer, audience: this.config.jwt.audience,
        requiredClaims: ['sub', 'jti', 'iat', 'exp']
      });
      if (!result.payload.sub || !result.payload.jti || typeof result.payload.iat !== 'number') throw new Error('missing claim');
      return { userId: result.payload.sub, jti: result.payload.jti, issuedAt: result.payload.iat };
    } catch { throw new ApiError(401, 'AUTH_INVALID_TOKEN', 'Token akses tidak valid.'); }
  }
  createRefresh(): { token: string; hash: string } {
    const token = randomBytes(32).toString('base64url');
    return { token, hash: this.hashRefresh(token) };
  }
  hashRefresh(token: string): string { return createHash('sha256').update(token, 'utf8').digest('hex'); }
  createCsrf(): string { return randomBytes(24).toString('base64url'); }
}
