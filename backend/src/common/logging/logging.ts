import { randomUUID } from 'node:crypto';

export const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers.set-cookie',
  'req.body.password',
  'req.body.passwordConfirmation',
  'req.body.accessToken',
  'req.body.refreshToken',
  '*.password',
  '*.passwordHash',
  '*.token',
  '*.tokenHash',
  '*.JWT_PRIVATE_KEY',
  '*.DATABASE_URL'
] as const;

export function requestIdFromHeader(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && /^[A-Za-z0-9._:-]{1,100}$/.test(candidate) ? candidate : randomUUID();
}
