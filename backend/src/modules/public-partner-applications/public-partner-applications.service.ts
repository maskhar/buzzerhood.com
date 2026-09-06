import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { sql } from 'kysely';
import { DatabaseService } from '../../common/database/database.service.js';
import { EmailService, type PublicPartnerApplicationEmail } from '../../common/email/email.service.js';
import { ApiError } from '../../common/errors/api-error.js';
import { postgresMessage } from '../../common/errors/postgres-error.js';
import type { PublicPartnerApplicationInput } from './public-partner-applications.schemas.js';

@Injectable()
export class PublicPartnerApplicationsService {
  private readonly logger = new Logger(PublicPartnerApplicationsService.name);

  constructor(private readonly database: DatabaseService, private readonly email: EmailService) {}

  async create(input: PublicPartnerApplicationInput): Promise<{ id: string; status: 'received' }> {
    const application: PublicPartnerApplicationEmail = {
      id: randomUUID(),
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      whatsapp: input.whatsapp,
      city: input.city,
      category: input.category,
      message: input.message ?? null
    };
    try {
      await sql`insert into buzzerhood.public_partner_applications(id,full_name,email,whatsapp,city,category,message,details)
        values(${application.id},${application.fullName},${application.email},${application.whatsapp},${application.city},${application.category},${application.message},${JSON.stringify(input.details)}::jsonb)`.execute(this.database.db);
    } catch (error) {
      const message = postgresMessage(error);
      if (/active_email_idx/i.test(message)) throw new ApiError(409, 'PARTNER_APPLICATION_EMAIL_EXISTS', 'Email sudah digunakan pada pendaftaran Partner yang masih aktif.');
      if (/active_whatsapp_idx/i.test(message)) throw new ApiError(409, 'PARTNER_APPLICATION_WHATSAPP_EXISTS', 'Nomor WhatsApp sudah digunakan pada pendaftaran Partner yang masih aktif.');
      throw error;
    }
    this.logger.log({ event: 'public_partner_application.created', applicationId: application.id, category: application.category });
    await this.email.sendPartnerApplicationReceived(application);
    return { id: application.id, status: 'received' };
  }
}
