import { generateKeyPairSync, randomUUID } from 'node:crypto';
import type { OutgoingHttpHeaders } from 'node:http';
import cookie from '@fastify/cookie';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { sql } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module.js';
import type { AppConfiguration } from '../../src/common/config/configuration.js';
import { DatabaseService } from '../../src/common/database/database.service.js';
import { ApiExceptionFilter } from '../../src/common/errors/api-exception.filter.js';
import { TokenService } from '../../src/common/security/token.service.js';

const origin = 'https://test.buzzerhood.invalid';
const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) throw new Error('TEST_DATABASE_URL is required.');

function makeConfig(): AppConfiguration {
  const pair = generateKeyPairSync('ed25519');
  return {
    environment: 'test', host: '127.0.0.1', port: 3100,
    database: { url: databaseUrl!, poolMin: 0, poolMax: 1, connectionTimeoutMs: 5000, queryTimeoutMs: 10000 },
    jwt: { issuer: 'https://auth.test.buzzerhood.invalid', audience: 'buzzerhood-test', accessTtlSeconds: 600, keyId: 'integration-1', privateKeyPem: pair.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString(), publicKeyPem: pair.publicKey.export({ format: 'pem', type: 'spki' }).toString() },
    refresh: { ttlSeconds: 3600, cookieName: 'buzzerhood_refresh', csrfCookieName: 'buzzerhood_csrf', secure: false, sameSite: 'lax' },
    corsOrigins: [origin], registrationMode: 'open', rateLimit: { ttlMs: 60_000, max: 100 }, swaggerEnabled: false, logLevel: 'silent'
  };
}
function cookies(headers: OutgoingHttpHeaders): { refresh: string; csrf: string; header: string } {
  const values = headers['set-cookie']; const list = (Array.isArray(values) ? values : values ? [values] : []).map(String);
  const refresh = list.find((value) => value.startsWith('buzzerhood_refresh='))?.split(';')[0]?.split('=')[1];
  const csrf = list.find((value) => value.startsWith('buzzerhood_csrf='))?.split(';')[0]?.split('=')[1];
  if (!refresh || !csrf) throw new Error('Expected auth cookies.');
  return { refresh, csrf, header: `buzzerhood_refresh=${refresh}; buzzerhood_csrf=${csrf}` };
}

describe('B1 auth and database context', () => {
  let app: NestFastifyApplication; let db: DatabaseService; let tokenService: TokenService;
  beforeAll(async () => {
    app = await NestFactory.create<NestFastifyApplication>(AppModule.register(makeConfig()), new FastifyAdapter({ logger: false }));
    await app.register(cookie); app.useGlobalFilters(new ApiExceptionFilter()); app.setGlobalPrefix('api/v1', { exclude: ['health', 'ready'] }); await app.init(); await app.getHttpAdapter().getInstance().ready();
    db = app.get(DatabaseService); tokenService = app.get(TokenService);
  });
  afterAll(async () => { await app.close(); });

  it('passes register/login/me/rotation/replay/logout/logout-all acceptance', async () => {
    const email = 'User@Example.com'; const password = 'correct horse battery staple';
    const registration = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: { email, password, displayName: 'User' } });
    expect(registration.statusCode).toBe(201); const registered = registration.json<{ accessToken: string }>(); expect(registered.accessToken).toBeTruthy();
    const originalCookies = cookies(registration.headers);
    const setCookies = (registration.headers['set-cookie'] ?? []).toString();
    expect(setCookies).toContain('HttpOnly'); expect(setCookies).toContain('SameSite=Lax'); expect(setCookies).not.toContain(password);
    const storedUser = await sql<{ password_hash: string }>`select password_hash from buzzerhood.lookup_auth_user('user@example.com')`.execute(db.db);
    const storedSession = await sql<{ token_hash: string }>`select token_hash from buzzerhood.lookup_refresh_session(${tokenService.hashRefresh(originalCookies.refresh)})`.execute(db.db);
    expect(storedUser.rows[0]?.password_hash).toMatch(/^\$argon2id\$/); expect(storedUser.rows[0]?.password_hash).not.toContain(password); expect(storedSession.rows[0]?.token_hash).not.toBe(originalCookies.refresh);

    const duplicate = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: { email: ' user@example.com ', password } });
    expect(duplicate.statusCode).toBe(409); expect(duplicate.body).not.toContain('duplicate key');
    const mass = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: { email: 'mass@example.com', password, role: 'super_admin', status: 'active' } });
    expect(mass.statusCode).toBe(422);
    const injection = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: "' or 1=1 --@example.com", password } });
    expect(injection.statusCode).toBe(422);

    const login = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: 'user@example.com', password } });
    expect(login.statusCode).toBe(201); const loginBody = login.json<{ accessToken: string }>(); const loginCookies = cookies(login.headers);
    const me = await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { authorization: `Bearer ${loginBody.accessToken}` } });
    expect(me.statusCode).toBe(200); expect(me.json<{ email: string; roles: string[] }>().email).toBe(email); expect(me.json<{ roles: string[] }>().roles).toEqual([]);

    const refresh = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', headers: { origin, cookie: loginCookies.header, 'x-csrf-token': loginCookies.csrf } });
    expect(refresh.statusCode).toBe(201); const rotatedCookies = cookies(refresh.headers);
    const replay = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', headers: { origin, cookie: loginCookies.header, 'x-csrf-token': loginCookies.csrf } });
    expect(replay.statusCode).toBe(401); expect(replay.json<{ error: { code: string } }>().error.code).toBe('AUTH_REFRESH_REPLAYED');
    const familyRevoked = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', headers: { origin, cookie: rotatedCookies.header, 'x-csrf-token': rotatedCookies.csrf } });
    expect(familyRevoked.statusCode).toBe(401);

    const login2 = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password } }); const session2 = cookies(login2.headers);
    const logout = await app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: { origin, cookie: session2.header, 'x-csrf-token': session2.csrf } }); expect(logout.statusCode).toBe(201);
    const afterLogout = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', headers: { origin, cookie: session2.header, 'x-csrf-token': session2.csrf } }); expect(afterLogout.statusCode).toBe(401);

    const login3 = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password } }); const session3 = cookies(login3.headers); const token3 = login3.json<{ accessToken: string }>().accessToken;
    const login4 = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password } }); const session4 = cookies(login4.headers);
    const logoutAll = await app.inject({ method: 'POST', url: '/api/v1/auth/logout-all', headers: { origin, authorization: `Bearer ${token3}`, cookie: session3.header, 'x-csrf-token': session3.csrf } }); expect(logoutAll.statusCode).toBe(201);
    for (const session of [session3, session4, originalCookies]) {
      const denied = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', headers: { origin, cookie: session.header, 'x-csrf-token': session.csrf } }); expect(denied.statusCode).toBe(401);
    }
  });

  it('denies suspended users and commits session revocation', async () => {
    const email = `suspended-${randomUUID()}@example.com`; const password = 'another secure test password';
    const created = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: { email, password } }); const session = cookies(created.headers); const id = (await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { authorization: `Bearer ${created.json<{ accessToken: string }>().accessToken}` } })).json<{ id: string }>().id;
    await db.withUserContext(id, (tx) => sql`update buzzerhood.users set status = 'suspended' where id = ${id}`.execute(tx));
    expect((await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password } })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', headers: { origin, cookie: session.header, 'x-csrf-token': session.csrf } })).statusCode).toBe(401);
  });

  it('keeps transaction-local identities isolated on a one-connection pool', async () => {
    const a = randomUUID(); const b = randomUUID();
    expect((await db.withUserContext(a, async (tx) => (await sql<{ id: string }>`select buzzerhood.current_user_id()::text id`.execute(tx)).rows[0]?.id))).toBe(a);
    expect((await db.withUserContext(b, async (tx) => (await sql<{ id: string }>`select buzzerhood.current_user_id()::text id`.execute(tx)).rows[0]?.id))).toBe(b);
    const outside = await sql<{ id: string | null }>`select buzzerhood.current_user_id()::text id`.execute(db.db); expect(outside.rows[0]?.id).toBeNull();
  });

  it('preserves auth.uid fallback and least-privilege runtime role', async () => {
    const fallback = randomUUID();
    const result = await db.db.transaction().execute(async (tx) => { await sql`select set_config('request.jwt.claim.sub', ${fallback}, true)`.execute(tx); return sql<{ id: string }>`select buzzerhood.current_user_id()::text id`.execute(tx); });
    expect(result.rows[0]?.id).toBe(fallback);
    const role = await sql<{ rolsuper: boolean; rolbypassrls: boolean; rolcreatedb: boolean; rolcreaterole: boolean }>`select rolsuper, rolbypassrls, rolcreatedb, rolcreaterole from pg_roles where rolname = current_user`.execute(db.db);
    expect(role.rows[0]).toEqual({ rolsuper: false, rolbypassrls: false, rolcreatedb: false, rolcreaterole: false });
  });
});
