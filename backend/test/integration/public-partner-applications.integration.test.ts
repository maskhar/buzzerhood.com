import { generateKeyPairSync } from 'node:crypto';
import cookie from '@fastify/cookie';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module.js';
import type { AppConfiguration } from '../../src/common/config/configuration.js';
import { ApiExceptionFilter } from '../../src/common/errors/api-exception.filter.js';

const databaseUrl = process.env.TEST_DATABASE_URL;
const adminUrl = process.env.TEST_ADMIN_DATABASE_URL;

if (!databaseUrl || !adminUrl) throw new Error('Public partner application test database URLs are required.');
const testDatabaseUrl = databaseUrl;
const testAdminUrl = adminUrl;

function config(): AppConfiguration {
  const pair = generateKeyPairSync('ed25519');
  return {
    environment: 'test', host: '127.0.0.1', port: 3100,
    database: { url: testDatabaseUrl, poolMin: 0, poolMax: 1, connectionTimeoutMs: 5_000, queryTimeoutMs: 10_000 },
    jwt: { issuer: 'https://auth.test.buzzerhood.invalid', audience: 'buzzerhood-test', accessTtlSeconds: 600, keyId: 'public-applications-test', privateKeyPem: pair.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString(), publicKeyPem: pair.publicKey.export({ format: 'pem', type: 'spki' }).toString() },
    refresh: { ttlSeconds: 3_600, cookieName: 'buzzerhood_refresh', csrfCookieName: 'buzzerhood_csrf', secure: false, sameSite: 'lax' },
    corsOrigins: ['https://test.buzzerhood.invalid'], registrationMode: 'open', rateLimit: { ttlMs: 60_000, max: 1_000 },
    email: { enabled: false, host: null, port: 587, secure: false, user: null, password: null, from: null, partnerApplicationNotificationEmail: null, publicWebUrl: "https://buzzerhood.com" },
    swaggerEnabled: false, logLevel: 'silent'
  };
}

function payload(suffix: string) {
  const phoneSuffix = [...suffix].reduce((value, character) => ((value * 31) + character.charCodeAt(0)) % 1_000_000_000, 0).toString().padStart(9, '0');
  return {
    fullName: `Partner ${suffix}`, email: `partner-${suffix}@example.com`, whatsapp: `+628${phoneSuffix}`, city: 'Jakarta', category: 'influencer',
    message: 'Saya ingin bergabung.', details: { platforms: ['Instagram', 'TikTok'], niche: 'Lifestyle' }, consent: true
  };
}

describe('public partner applications API', () => {
  let app: NestFastifyApplication;
  let admin: Pool;
  let applicationId: string;
  let regularToken: string;
  let reviewerToken: string;

  async function register(email: string) {
    const response = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: { email, password: 'correct horse battery staple', displayName: email.split('@')[0] } });
    expect(response.statusCode).toBe(201);
    return response.json<{ accessToken: string }>().accessToken;
  }

  beforeAll(async () => {
    app = await NestFactory.create<NestFastifyApplication>(AppModule.register(config()), new FastifyAdapter({ logger: false }));
    await app.register(cookie);
    app.useGlobalFilters(new ApiExceptionFilter());
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'ready'] });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    admin = new Pool({ connectionString: testAdminUrl });
    regularToken = await register('public-applications-user@example.com');
    reviewerToken = await register('public-applications-reviewer@example.com');
    const reviewer = await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { authorization: `Bearer ${reviewerToken}` } });
    await admin.query("insert into buzzerhood.user_roles(profile_id,role_id) select $1,id from buzzerhood.roles where key='internal_team'", [reviewer.json<{ id: string }>().id]);
  });

  afterAll(async () => { await admin.end(); await app.close(); });

  it('stores valid application and ignores honeypot submission', async () => {
    const accepted = await app.inject({ method: 'POST', url: '/api/v1/public/partner-applications', payload: payload('accepted') });
    expect(accepted.statusCode).toBe(201);
    expect(accepted.json()).toMatchObject({ status: 'received' });

    applicationId = accepted.json<{ id: string }>().id;
    const stored = await admin.query<{ email: string; status: string; details: unknown }>('select email, status, details from buzzerhood.public_partner_applications where id = $1', [applicationId]);
    expect(stored.rows).toEqual([{ email: 'partner-accepted@example.com', status: 'pending', details: { platforms: ['Instagram', 'TikTok'], niche: 'Lifestyle' } }]);

    const before = await admin.query<{ count: string }>('select count(*)::text as count from buzzerhood.public_partner_applications');
    const honeypot = await app.inject({ method: 'POST', url: '/api/v1/public/partner-applications', payload: { ...payload('bot'), website: 'https://spam.invalid' } });
    expect(honeypot.statusCode).toBe(201);
    expect(honeypot.json()).toEqual({ status: 'received' });
    const after = await admin.query<{ count: string }>('select count(*)::text as count from buzzerhood.public_partner_applications');
    expect(after.rows[0]?.count).toBe(before.rows[0]?.count);
  });

  it('does not expose applications through the app role without transaction-local user context', async () => {
    const applicationPool = new Pool({ connectionString: testDatabaseUrl });
    try {
      const result = await applicationPool.query<{ count: string }>('select count(*)::text as count from buzzerhood.public_partner_applications');
      expect(result.rows[0]?.count).toBe('0');
    } finally {
      await applicationPool.end();
    }
  });

  it('rejects invalid payload', async () => {
    const invalid = await app.inject({ method: 'POST', url: '/api/v1/public/partner-applications', payload: { ...payload('invalid'), consent: false } });
    expect(invalid.statusCode).toBe(422);
    expect(invalid.json<{ error: { requestId: string } }>().error.requestId).toBeTruthy();
  });

  it('blocks duplicate active email and normalized WhatsApp but allows rejected applications to reapply', async () => {
    const original = payload('identity-check');
    expect((await app.inject({ method: 'POST', url: '/api/v1/public/partner-applications', remoteAddress: '198.51.100.11', payload: original })).statusCode).toBe(201);

    const duplicateEmail = await app.inject({ method: 'POST', url: '/api/v1/public/partner-applications', remoteAddress: '198.51.100.12', payload: { ...payload('identity-email'), email: `  ${original.email.toUpperCase()}  ` } });
    expect(duplicateEmail.statusCode).toBe(409);
    expect(duplicateEmail.json<{ error: { code: string } }>().error.code).toBe('PARTNER_APPLICATION_EMAIL_EXISTS');

    const duplicateWhatsapp = await app.inject({ method: 'POST', url: '/api/v1/public/partner-applications', remoteAddress: '198.51.100.13', payload: { ...payload('identity-phone'), whatsapp: original.whatsapp.replace('+62', '0') } });
    expect(duplicateWhatsapp.statusCode).toBe(409);
    expect(duplicateWhatsapp.json<{ error: { code: string } }>().error.code).toBe('PARTNER_APPLICATION_WHATSAPP_EXISTS');

    const rejected = await app.inject({ method: 'POST', url: '/api/v1/public/partner-applications', remoteAddress: '198.51.100.14', payload: payload('rejected-reapply') });
    const rejectedId = rejected.json<{ id: string }>().id;
    expect((await app.inject({ method: 'POST', url: `/api/v1/admin/public-partner-applications/${rejectedId}/reject`, headers: { authorization: `Bearer ${reviewerToken}` }, payload: { note: 'Belum sesuai.' } })).statusCode).toBe(201);
    expect((await app.inject({ method: 'POST', url: '/api/v1/public/partner-applications', remoteAddress: '198.51.100.15', payload: payload('rejected-reapply') })).statusCode).toBe(201);
  });

  it('throttles fourth request from one address', async () => {
    for (const suffix of ['one', 'two', 'three']) {
      expect((await app.inject({ method: 'POST', url: '/api/v1/public/partner-applications', remoteAddress: '192.0.2.10', payload: payload(suffix) })).statusCode).toBe(201);
    }
    const throttled = await app.inject({ method: 'POST', url: '/api/v1/public/partner-applications', remoteAddress: '192.0.2.10', payload: payload('four') });
    expect(throttled.statusCode).toBe(429);
  });

  it('allows only partners.manage reviewer to inspect and terminally review applications', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/v1/admin/public-partner-applications' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/api/v1/admin/public-partner-applications', headers: { authorization: `Bearer ${regularToken}` } })).statusCode).toBe(403);

    const list = await app.inject({ method: 'GET', url: '/api/v1/admin/public-partner-applications?status=pending', headers: { authorization: `Bearer ${reviewerToken}` } });
    expect(list.statusCode).toBe(200);
    expect(list.json<{ data: Array<{ id: string; email: string }> }>().data).toContainEqual(expect.objectContaining({ id: applicationId, email: 'partner-accepted@example.com' }));

    const activeList = await app.inject({ method: 'GET', url: '/api/v1/admin/public-partner-applications?status=pending&archived=false', headers: { authorization: `Bearer ${reviewerToken}` } });
    expect(activeList.statusCode).toBe(200);
    expect(activeList.json<{ data: Array<{ id: string }> }>().data).toContainEqual(expect.objectContaining({ id: applicationId }));

    const detail = await app.inject({ method: 'GET', url: `/api/v1/admin/public-partner-applications/${applicationId}`, headers: { authorization: `Bearer ${reviewerToken}` } });
    expect(detail.statusCode).toBe(200);
    expect(detail.json()).toMatchObject({ id: applicationId, status: 'pending', details: { niche: 'Lifestyle' } });

    expect((await app.inject({ method: 'POST', url: `/api/v1/admin/public-partner-applications/${applicationId}/approve`, headers: { authorization: `Bearer ${regularToken}` }, payload: { note: 'unauthorized' } })).statusCode).toBe(403);
    const approved = await app.inject({ method: 'POST', url: `/api/v1/admin/public-partner-applications/${applicationId}/approve`, headers: { authorization: `Bearer ${reviewerToken}` }, payload: { note: 'Contact data verified.' } });
    expect(approved.statusCode).toBe(201);
    expect(approved.json()).toMatchObject({ id: applicationId, status: 'approved', reviewNote: 'Contact data verified.' });
    expect(approved.json<{ reviewedBy: string; reviewedAt: string }>().reviewedBy).toBeTruthy();
    expect(approved.json<{ reviewedBy: string; reviewedAt: string }>().reviewedAt).toBeTruthy();

    expect((await app.inject({ method: 'POST', url: `/api/v1/admin/public-partner-applications/${applicationId}/reject`, headers: { authorization: `Bearer ${reviewerToken}` }, payload: {} })).statusCode).toBe(404);
    const partnerCount = await admin.query<{ count: string }>("select count(*)::text count from buzzerhood.partners where display_name='Partner accepted'");
    expect(partnerCount.rows[0]?.count).toBe('1');
    const invitation = await admin.query<{ status: string; token_count: string }>("select m.status::text, count(t.id)::text token_count from buzzerhood.partner_members m join buzzerhood.profiles p on p.id=m.profile_id join buzzerhood.users u on u.id=p.user_id left join buzzerhood.account_action_tokens t on t.user_id=u.id and t.kind='partner_invitation' where u.normalized_email='partner-accepted@example.com' group by m.status");
    expect(invitation.rows).toEqual([{ status: 'invited', token_count: '1' }]);

    const resent = await app.inject({ method: 'POST', url: `/api/v1/admin/public-partner-applications/${applicationId}/invite`, headers: { authorization: `Bearer ${reviewerToken}` } });
    expect(resent.statusCode).toBe(201);
    expect(resent.json()).toMatchObject({ status: 'invited' });
    const resentInvitation = await admin.query<{ status: string; token_count: string }>("select m.status::text, count(t.id)::text token_count from buzzerhood.partner_members m join buzzerhood.profiles p on p.id=m.profile_id join buzzerhood.users u on u.id=p.user_id left join buzzerhood.account_action_tokens t on t.user_id=u.id and t.kind='partner_invitation' where u.normalized_email='partner-accepted@example.com' group by m.status");
    expect(resentInvitation.rows).toEqual([{ status: 'invited', token_count: '2' }]);
    const invitedDetail = await app.inject({ method: 'GET', url: `/api/v1/admin/public-partner-applications/${applicationId}`, headers: { authorization: `Bearer ${reviewerToken}` } });
    expect(invitedDetail.json()).toMatchObject({ invitationStatus: 'invited' });
    await admin.query("update buzzerhood.users users set status='active' from buzzerhood.profiles profiles join buzzerhood.partner_members members on members.profile_id=profiles.id where profiles.user_id=users.id and members.partner_id=(select partner_id from buzzerhood.public_partner_applications where id=$1)", [applicationId]);
    await admin.query("update buzzerhood.partner_members set status='active',joined_at=now() where partner_id=(select partner_id from buzzerhood.public_partner_applications where id=$1)", [applicationId]);
    const activeDetail = await app.inject({ method: 'GET', url: `/api/v1/admin/public-partner-applications/${applicationId}`, headers: { authorization: `Bearer ${reviewerToken}` } });
    expect(activeDetail.json()).toMatchObject({ invitationStatus: 'active' });
  });

  it('archives approved Partner access, reuses identity on approval, and blocks conflicting restore', async () => {
    const linked = await admin.query<{ partner_id: string }>('select partner_id from buzzerhood.public_partner_applications where id=$1', [applicationId]);
    const partnerId = linked.rows[0]?.partner_id;
    expect(partnerId).toBeTruthy();
    await admin.query("update buzzerhood.users users set status='active' from buzzerhood.partner_members members where members.profile_id=users.id and members.partner_id=$1", [partnerId]);
    await admin.query("update buzzerhood.partner_members set status='active',joined_at=now() where partner_id=$1", [partnerId]);

    expect((await app.inject({ method: 'POST', url: `/api/v1/admin/public-partner-applications/${applicationId}/archive`, headers: { authorization: `Bearer ${reviewerToken}` } })).statusCode).toBe(201);
    const archived = await admin.query<{ archived: boolean; member_status: string }>('select partners.archived_at is not null archived,members.status::text member_status from buzzerhood.partners partners join buzzerhood.partner_members members on members.partner_id=partners.id where partners.id=$1', [partnerId]);
    expect(archived.rows).toEqual([{ archived: true, member_status: 'suspended' }]);

    const repeatedPayload = { ...payload('accepted'), whatsapp: payload('accepted').whatsapp.replace('+62', '0') };
    const repeated = await app.inject({ method: 'POST', url: '/api/v1/public/partner-applications', remoteAddress: '198.51.100.16', payload: repeatedPayload });
    expect(repeated.statusCode).toBe(201);
    const repeatedId = repeated.json<{ id: string }>().id;
    expect((await app.inject({ method: 'POST', url: `/api/v1/admin/public-partner-applications/${repeatedId}/approve`, headers: { authorization: `Bearer ${reviewerToken}` }, payload: {} })).statusCode).toBe(201);

    const reused = await admin.query<{ partner_id: string; member_status: string; archived: boolean }>('select application.partner_id,members.status::text member_status,partners.archived_at is not null archived from buzzerhood.public_partner_applications application join buzzerhood.partners partners on partners.id=application.partner_id join buzzerhood.partner_members members on members.partner_id=partners.id where application.id=$1', [repeatedId]);
    expect(reused.rows).toEqual([{ partner_id: partnerId, member_status: 'active', archived: false }]);
    const partnerCount = await admin.query<{ count: string }>("select count(*)::text count from buzzerhood.partners where display_name='Partner accepted'");
    expect(partnerCount.rows[0]?.count).toBe('1');

    const restore = await app.inject({ method: 'POST', url: `/api/v1/admin/public-partner-applications/${applicationId}/restore`, headers: { authorization: `Bearer ${reviewerToken}` } });
    expect(restore.statusCode).toBe(409);
    expect(restore.json<{ error: { code: string } }>().error.code).toBe('PARTNER_APPLICATION_RESTORE_CONFLICT');
  });
});

