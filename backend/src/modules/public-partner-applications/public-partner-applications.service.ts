import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { sql } from 'kysely';
import { DatabaseService } from '../../common/database/database.service.js';
import { EmailService, type PublicPartnerApplicationEmail } from '../../common/email/email.service.js';
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
    await sql`insert into buzzerhood.public_partner_applications(id,full_name,email,whatsapp,city,category,message,details)
      values(${application.id},${application.fullName},${application.email},${application.whatsapp},${application.city},${application.category},${application.message},${JSON.stringify(input.details)}::jsonb)`.execute(this.database.db);
    this.logger.log({ event: 'public_partner_application.created', applicationId: application.id, category: application.category });
    await this.email.sendPartnerApplicationReceived(application);
    return { id: application.id, status: 'received' };
  }
}
