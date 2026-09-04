import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { sql, type Transaction } from 'kysely';
import { APP_CONFIGURATION } from '../../common/config/configuration.module.js';
import type { AppConfiguration } from '../../common/config/configuration.js';
import { DatabaseService } from '../../common/database/database.service.js';
import type { Database } from '../../common/database/database.types.js';
import { ApiError } from '../../common/errors/api-error.js';
import { PasswordService } from '../../common/security/password.service.js';
import { TokenService } from '../../common/security/token.service.js';
import type { AuthResult, AuthenticatedUser } from './auth.types.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';

type LoginUser = { id: string; email: string; password_hash: string; status: string };
type Session = { id: string; user_id: string; family_id: string; replaced_by_session_id: string | null; revoked_at: Date | null; expires_at: Date };

@Injectable()
export class AuthService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(PasswordService) private readonly passwords: PasswordService,
    @Inject(TokenService) private readonly tokens: TokenService,
    @Inject(APP_CONFIGURATION) private readonly config: AppConfiguration
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    if (this.config.registrationMode !== 'open') throw new ApiError(403, 'AUTH_REGISTRATION_CLOSED', 'Registrasi belum dibuka.');
    const id = randomUUID(); const normalized = this.normalizeEmail(input.email); const passwordHash = await this.passwords.hash(input.password);
    try {
      await this.database.withUserContext(id, async (transaction) => {
        await transaction.insertInto('buzzerhood.users').values({ id, email: input.email.trim(), normalized_email: normalized, password_hash: passwordHash, status: 'active', email_verified_at: null, password_changed_at: new Date(), last_login_at: null }).execute();
        await transaction.insertInto('buzzerhood.profiles').values({ id, user_id: id, display_name: input.displayName ?? null, avatar_path: null }).execute();
        await this.event(transaction, id, null, 'account_registered');
      });
    } catch (error) {
      if (this.postgresCode(error) === '23505') throw new ApiError(409, 'AUTH_EMAIL_UNAVAILABLE', 'Email tidak dapat digunakan.');
      throw error;
    }
    return this.createLogin(id);
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const normalized = this.normalizeEmail(input.email);
    const lookup = await sql<LoginUser>`select * from buzzerhood.lookup_auth_user(${normalized})`.execute(this.database.db);
    const user = lookup.rows[0];
    const valid = user ? await this.passwords.verify(user.password_hash, input.password) : false;
    if (!user || !valid || user.status !== 'active') throw new ApiError(401, 'AUTH_INVALID_CREDENTIALS', 'Email atau password tidak valid.');
    return this.database.withUserContext(user.id, async (transaction) => {
      await sql`update buzzerhood.users set last_login_at = now() where id = ${user.id}`.execute(transaction);
      await this.event(transaction, user.id, null, 'login_succeeded');
      return this.createLogin(user.id, transaction);
    });
  }

  async refresh(plainToken: string | undefined): Promise<AuthResult> {
    if (!plainToken) throw new ApiError(401, 'AUTH_REFRESH_INVALID', 'Sesi tidak valid.');
    const digest = this.tokens.hashRefresh(plainToken);
    const lookup = await sql<Session>`select * from buzzerhood.lookup_refresh_session(${digest})`.execute(this.database.db);
    const found = lookup.rows[0];
    if (!found) throw new ApiError(401, 'AUTH_REFRESH_INVALID', 'Sesi tidak valid.');
    const outcome = await this.database.withUserContext(found.user_id, async (transaction): Promise<{ result?: AuthResult; failure?: 'replayed' | 'invalid' }> => {
      const locked = await sql<Session>`select id, user_id, family_id, replaced_by_session_id, revoked_at, expires_at from buzzerhood.refresh_sessions where id = ${found.id} for update`.execute(transaction);
      const session = locked.rows[0];
      if (!session) return { failure: 'invalid' };
      if (session.replaced_by_session_id || session.revoked_at) {
        await sql`update buzzerhood.refresh_sessions set revoked_at = coalesce(revoked_at, now()), revocation_reason = 'refresh_replay', replay_detected_at = case when id = ${session.id} then now() else replay_detected_at end where family_id = ${session.family_id} and revoked_at is null`.execute(transaction);
        await this.event(transaction, session.user_id, session.id, 'refresh_replayed');
        return { failure: 'replayed' };
      }
      if (new Date(session.expires_at) <= new Date()) return { failure: 'invalid' };
      const active = await sql<{ status: string }>`select status from buzzerhood.users where id = ${session.user_id}`.execute(transaction);
      if (active.rows[0]?.status !== 'active') {
        await sql`update buzzerhood.refresh_sessions set revoked_at = now(), revocation_reason = 'account_inactive' where family_id = ${session.family_id} and revoked_at is null`.execute(transaction);
        return { failure: 'invalid' };
      }
      const next = this.tokens.createRefresh(); const nextId = randomUUID();
      await this.insertSession(transaction, session.user_id, session.family_id, nextId, next.hash, session.id);
      await sql`update buzzerhood.refresh_sessions set replaced_by_session_id = ${nextId}, rotated_at = now(), last_used_at = now(), revoked_at = now(), revocation_reason = 'rotated' where id = ${session.id}`.execute(transaction);
      await this.event(transaction, session.user_id, nextId, 'refresh_rotated');
      return { result: await this.result(session.user_id, next.token) };
    });
    if (outcome.failure === 'replayed') throw new ApiError(401, 'AUTH_REFRESH_REPLAYED', 'Sesi tidak valid. Silakan masuk kembali.');
    if (!outcome.result) throw new ApiError(401, 'AUTH_REFRESH_INVALID', 'Sesi tidak valid.');
    return outcome.result;
  }

  async logout(plainToken: string | undefined): Promise<void> {
    if (!plainToken) return;
    const lookup = await sql<Session>`select * from buzzerhood.lookup_refresh_session(${this.tokens.hashRefresh(plainToken)})`.execute(this.database.db);
    const session = lookup.rows[0]; if (!session) return;
    await this.database.withUserContext(session.user_id, async (transaction) => {
      await sql`update buzzerhood.refresh_sessions set revoked_at = coalesce(revoked_at, now()), revocation_reason = coalesce(revocation_reason, 'logout') where family_id = ${session.family_id} and revoked_at is null`.execute(transaction);
      await this.event(transaction, session.user_id, session.id, 'session_revoked');
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.database.withUserContext(userId, async (transaction) => {
      await sql`update buzzerhood.refresh_sessions set revoked_at = now(), revocation_reason = 'logout_all' where user_id = ${userId} and revoked_at is null`.execute(transaction);
      await this.event(transaction, userId, null, 'sessions_revoked');
    });
  }

  async me(user: AuthenticatedUser) {
    return this.database.withUserContext(user.id, async (transaction) => {
      const identity = await sql<{ id: string; email: string; display_name: string | null; avatar_path: string | null }>`select u.id, u.email, p.display_name, p.avatar_path from buzzerhood.users u left join buzzerhood.profiles p on p.id = u.id where u.id = ${user.id}`.execute(transaction);
      const roles = await sql<{ key: string }>`select r.key from buzzerhood.user_roles ur join buzzerhood.roles r on r.id = ur.role_id where ur.profile_id = ${user.id} and ur.revoked_at is null order by r.key`.execute(transaction);
      const permissions = await sql<{ key: string }>`select distinct p.key from buzzerhood.user_roles ur join buzzerhood.role_permissions rp on rp.role_id = ur.role_id join buzzerhood.permissions p on p.id = rp.permission_id where ur.profile_id = ${user.id} and ur.revoked_at is null order by p.key`.execute(transaction);
      const row = identity.rows[0];
      if (!row) throw new ApiError(401, 'AUTH_INVALID_TOKEN', 'Token akses tidak valid.');
      return { id: row.id, email: row.email, profile: { displayName: row.display_name, avatarPath: row.avatar_path }, roles: roles.rows.map((x) => x.key), permissions: permissions.rows.map((x) => x.key) };
    });
  }

  private async createLogin(userId: string, transaction?: Transaction<Database>): Promise<AuthResult> {
    if (!transaction) return this.database.withUserContext(userId, (tx) => this.createLogin(userId, tx));
    const refresh = this.tokens.createRefresh(); const sessionId = randomUUID();
    await this.insertSession(transaction, userId, sessionId, sessionId, refresh.hash, null);
    return this.result(userId, refresh.token);
  }
  private async result(userId: string, refreshToken: string): Promise<AuthResult> {
    return { accessToken: await this.tokens.issueAccess(userId), tokenType: 'Bearer', expiresIn: this.config.jwt.accessTtlSeconds, refreshToken, csrfToken: this.tokens.createCsrf() };
  }
  private insertSession(tx: Transaction<Database>, userId: string, familyId: string, id: string, tokenHash: string, parent: string | null) {
    return tx.insertInto('buzzerhood.refresh_sessions').values({ id, user_id: userId, family_id: familyId, token_hash: tokenHash, parent_session_id: parent, replaced_by_session_id: null, expires_at: new Date(Date.now() + this.config.refresh.ttlSeconds * 1000), last_used_at: null, rotated_at: null, revoked_at: null, revocation_reason: null, replay_detected_at: null }).execute();
  }
  private event(tx: Transaction<Database>, userId: string, sessionId: string | null, event: string) {
    return tx.insertInto('buzzerhood.auth_security_events').values({ user_id: userId, session_id: sessionId, event_type: event, metadata: {} }).execute();
  }
  private normalizeEmail(value: string): string { return value.trim().toLowerCase(); }
  private postgresCode(error: unknown): string | undefined { return typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined; }
}
