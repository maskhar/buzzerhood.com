import { readFileSync } from 'node:fs';
import { z } from 'zod';

const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true');
const integerString = (minimum: number, maximum: number) =>
  z.coerce.number().int().min(minimum).max(maximum);

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('127.0.0.1'),
  PORT: integerString(1, 65_535).default(3100),
  DATABASE_URL: z.string().url().refine((value) => value.startsWith('postgres://') || value.startsWith('postgresql://'), 'DATABASE_URL must use PostgreSQL.'),
  DATABASE_POOL_MIN: integerString(0, 20).default(0),
  DATABASE_POOL_MAX: integerString(1, 50).default(10),
  DATABASE_CONNECTION_TIMEOUT_MS: integerString(100, 60_000).default(5_000),
  DATABASE_QUERY_TIMEOUT_MS: integerString(100, 120_000).default(10_000),
  JWT_ISSUER: z.string().url(),
  JWT_AUDIENCE: z.string().min(1).max(200),
  JWT_ACCESS_TTL_SECONDS: integerString(60, 900).default(600),
  JWT_PRIVATE_KEY_PATH: z.string().min(1),
  JWT_PUBLIC_KEY_PATH: z.string().min(1),
  JWT_KEY_ID: z.string().min(1).max(100),
  REFRESH_TOKEN_TTL_SECONDS: integerString(3_600, 7_776_000).default(2_592_000),
  REFRESH_COOKIE_NAME: z.string().regex(/^[A-Za-z0-9_-]+$/).default('buzzerhood_refresh'),
  CSRF_COOKIE_NAME: z.string().regex(/^[A-Za-z0-9_-]+$/).default('buzzerhood_csrf'),
  COOKIE_SECURE: booleanString.default(false),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict']).default('lax'),
  CORS_ORIGINS: z.string().min(1),
  AUTH_REGISTRATION_MODE: z.enum(['closed', 'open']).default('closed'),
  AUTH_RATE_LIMIT_TTL_MS: integerString(1_000, 3_600_000).default(60_000),
  AUTH_RATE_LIMIT_MAX: integerString(1, 1_000).default(10),
  SWAGGER_ENABLED: booleanString.default(false),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info')
}).superRefine((value, context) => {
  if (value.DATABASE_POOL_MIN > value.DATABASE_POOL_MAX) {
    context.addIssue({ code: 'custom', path: ['DATABASE_POOL_MIN'], message: 'Pool minimum cannot exceed maximum.' });
  }
  if (value.NODE_ENV === 'production' && !value.COOKIE_SECURE) {
    context.addIssue({ code: 'custom', path: ['COOKIE_SECURE'], message: 'Production cookies must be Secure.' });
  }
  if (value.CORS_ORIGINS.split(',').some((origin) => origin.trim() === '*')) {
    context.addIssue({ code: 'custom', path: ['CORS_ORIGINS'], message: 'Wildcard CORS is forbidden.' });
  }
});

export type Environment = z.infer<typeof environmentSchema>;

export type AppConfiguration = {
  environment: Environment['NODE_ENV'];
  host: string;
  port: number;
  database: {
    url: string;
    poolMin: number;
    poolMax: number;
    connectionTimeoutMs: number;
    queryTimeoutMs: number;
  };
  jwt: {
    issuer: string;
    audience: string;
    accessTtlSeconds: number;
    privateKeyPem: string;
    publicKeyPem: string;
    keyId: string;
  };
  refresh: {
    ttlSeconds: number;
    cookieName: string;
    csrfCookieName: string;
    secure: boolean;
    sameSite: 'lax' | 'strict';
  };
  corsOrigins: readonly string[];
  registrationMode: 'closed' | 'open';
  rateLimit: { ttlMs: number; max: number };
  swaggerEnabled: boolean;
  logLevel: Environment['LOG_LEVEL'];
};

export function loadConfiguration(source: NodeJS.ProcessEnv = process.env): AppConfiguration {
  const parsed = environmentSchema.parse(source);
  const privateKeyPem = readFileSync(parsed.JWT_PRIVATE_KEY_PATH, 'utf8');
  const publicKeyPem = readFileSync(parsed.JWT_PUBLIC_KEY_PATH, 'utf8');
  if (!privateKeyPem.includes('PRIVATE KEY') || !publicKeyPem.includes('PUBLIC KEY')) {
    throw new Error('JWT key files are invalid.');
  }
  return {
    environment: parsed.NODE_ENV,
    host: parsed.HOST,
    port: parsed.PORT,
    database: {
      url: parsed.DATABASE_URL,
      poolMin: parsed.DATABASE_POOL_MIN,
      poolMax: parsed.DATABASE_POOL_MAX,
      connectionTimeoutMs: parsed.DATABASE_CONNECTION_TIMEOUT_MS,
      queryTimeoutMs: parsed.DATABASE_QUERY_TIMEOUT_MS
    },
    jwt: {
      issuer: parsed.JWT_ISSUER,
      audience: parsed.JWT_AUDIENCE,
      accessTtlSeconds: parsed.JWT_ACCESS_TTL_SECONDS,
      privateKeyPem,
      publicKeyPem,
      keyId: parsed.JWT_KEY_ID
    },
    refresh: {
      ttlSeconds: parsed.REFRESH_TOKEN_TTL_SECONDS,
      cookieName: parsed.REFRESH_COOKIE_NAME,
      csrfCookieName: parsed.CSRF_COOKIE_NAME,
      secure: parsed.COOKIE_SECURE,
      sameSite: parsed.COOKIE_SAME_SITE
    },
    corsOrigins: parsed.CORS_ORIGINS.split(',').map((value) => value.trim()).filter(Boolean),
    registrationMode: parsed.AUTH_REGISTRATION_MODE,
    rateLimit: { ttlMs: parsed.AUTH_RATE_LIMIT_TTL_MS, max: parsed.AUTH_RATE_LIMIT_MAX },
    swaggerEnabled: parsed.SWAGGER_ENABLED,
    logLevel: parsed.LOG_LEVEL
  };
}
