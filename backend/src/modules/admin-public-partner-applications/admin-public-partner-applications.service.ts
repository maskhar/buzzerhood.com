import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'kysely';
import { DatabaseService } from '../../common/database/database.service.js';
import { EmailService } from '../../common/email/email.service.js';
import { ApiError } from '../../common/errors/api-error.js';
import { postgresMessage } from '../../common/errors/postgres-error.js';
import { randomBytes } from 'node:crypto';
import { TokenService } from '../../common/security/token.service.js';
import type { AdminPublicPartnerApplicationQuery } from './admin-public-partner-applications.schemas.js';

type ApplicationRow = {
  id: string; full_name: string; email: string; whatsapp: string; city: string; category: string; message: string | null; details: unknown;
  status: string; review_note: string | null; reviewed_by: string | null; reviewed_at: Date | null; created_at: Date; updated_at: Date;
};

@Injectable()
export class AdminPublicPartnerApplicationsService {
  private readonly logger = new Logger(AdminPublicPartnerApplicationsService.name);

  constructor(private readonly database: DatabaseService, private readonly email: EmailService, private readonly tokens: TokenService) {}

  list(userId: string, query: AdminPublicPartnerApplicationQuery) {
    return this.database.withUserContext(userId, async (transaction) => {
      const status = query.status ?? 'pending';
      const offset = (query.page - 1) * query.limit;
      const count = await sql<{ total: string }>`select count(*)::text total from buzzerhood.public_partner_applications where status=${status}`.execute(transaction);
      const rows = await sql<ApplicationRow>`select id,full_name,email,whatsapp,city,category,message,details,status,review_note,reviewed_by,reviewed_at,created_at,updated_at from buzzerhood.public_partner_applications where status=${status} order by created_at desc limit ${query.limit} offset ${offset}`.execute(transaction);
      const total = Number(count.rows[0]?.total ?? 0);
      return { data: rows.rows.map((row) => this.dto(row)), meta: { page: query.page, limit: query.limit, total, hasNext: offset + rows.rows.length < total } };
    });
  }

  detail(userId: string, applicationId: string) {
    return this.database.withUserContext(userId, async (transaction) => {
      const result = await sql<ApplicationRow>`select id,full_name,email,whatsapp,city,category,message,details,status,review_note,reviewed_by,reviewed_at,created_at,updated_at from buzzerhood.public_partner_applications where id=${applicationId}`.execute(transaction);
      if (!result.rows[0]) throw new ApiError(404, 'PUBLIC_PARTNER_APPLICATION_NOT_FOUND', 'Pendaftaran Partner tidak ditemukan.');
      return this.dto(result.rows[0]);
    });
  }

  async review(userId: string, applicationId: string, decision: 'approved' | 'rejected', note?: string) {
    try {
      const application = await this.database.withUserContext(userId, async (transaction) => {
        const result = await sql<{ id: string }>`select buzzerhood.review_public_partner_application(${applicationId},${decision},${note ?? null}) id`.execute(transaction);
        const id = result.rows[0]?.id;
        if (!id) throw new Error('Public partner application review returned no identifier.');
        this.logger.log({ event: 'public_partner_application.reviewed', actorId: userId, applicationId: id, decision });
        return this.detailInTransaction(transaction, id);
      });
      await this.email.sendPartnerApplicationDecision({
        id: application.id,
        fullName: application.fullName,
        email: application.email,
        whatsapp: application.whatsapp,
        city: application.city,
        category: application.category,
        message: application.message,
        status: decision,
        reviewNote: application.reviewNote,
      });
      return application;
    } catch (error) {
      const message = postgresMessage(error);
      if (/permission denied/i.test(message)) throw new ApiError(403, 'PERMISSION_DENIED', 'Izin tidak mencukupi.');
      throw new ApiError(404, 'PUBLIC_PARTNER_APPLICATION_NOT_FOUND', 'Pendaftaran Partner tidak ditemukan atau tidak lagi pending.');
    }
  }

  async invite(userId: string, applicationId: string) {
    const token = randomBytes(32).toString('base64url');
    try {
      const result = await this.database.withUserContext(userId, (transaction) => sql<{ user_id: string; partner_id: string; email: string; display_name: string }>`select * from buzzerhood.create_partner_invitation(${applicationId},${this.tokens.hashRefresh(token)},${new Date(Date.now()+86_400_000)})`.execute(transaction));
      const created = result.rows[0]; if (!created) throw new Error('Invitation was not created.');
      await this.email.sendPartnerInvitation({ email: created.email, displayName: created.display_name, token });
      return { userId: created.user_id, partnerId: created.partner_id, status: 'invited' };
    } catch (error) {
      const message = postgresMessage(error);
      if (/permission denied/i.test(message)) throw new ApiError(403, 'PERMISSION_DENIED', 'Izin tidak mencukupi.');
      if (/already registered/i.test(message)) throw new ApiError(409, 'PARTNER_INVITATION_CONFLICT', 'Akun atau undangan sudah tersedia.');
      throw new ApiError(404, 'PUBLIC_PARTNER_APPLICATION_NOT_APPROVED', 'Pendaftaran Partner belum disetujui atau tidak ditemukan.');
    }
  }

  private async detailInTransaction(transaction: Parameters<DatabaseService['withUserContext']>[1] extends (transaction: infer T) => unknown ? T : never, applicationId: string) {
    const result = await sql<ApplicationRow>`select id,full_name,email,whatsapp,city,category,message,details,status,review_note,reviewed_by,reviewed_at,created_at,updated_at from buzzerhood.public_partner_applications where id=${applicationId}`.execute(transaction);
    if (!result.rows[0]) throw new ApiError(404, 'PUBLIC_PARTNER_APPLICATION_NOT_FOUND', 'Pendaftaran Partner tidak ditemukan.');
    return this.dto(result.rows[0]);
  }

  private dto(row: ApplicationRow) {
    return { id: row.id, fullName: row.full_name, email: row.email, whatsapp: row.whatsapp, city: row.city, category: row.category, message: row.message, details: row.details, status: row.status, reviewNote: row.review_note, reviewedBy: row.reviewed_by, reviewedAt: row.reviewed_at, createdAt: row.created_at, updatedAt: row.updated_at };
  }
}
