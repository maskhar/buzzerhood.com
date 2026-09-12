import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { sql } from 'kysely';
import { DatabaseService } from '../../common/database/database.service.js';
import { EmailService } from '../../common/email/email.service.js';
import { ApiError } from '../../common/errors/api-error.js';
import type { PublicCampaignRequestInput } from './public-campaign-requests.schemas.js';

const hash = (value: string) => createHash('sha256').update(value).digest('hex');
@Injectable()
export class PublicCampaignRequestsService {
  private readonly logger = new Logger(PublicCampaignRequestsService.name);
  constructor(private readonly database: DatabaseService, private readonly email: EmailService) {}
  async create(input: PublicCampaignRequestInput, ip: string, userAgent?: string): Promise<{ id: string; status: 'received' }> {
    const id = randomUUID(); const token = randomBytes(32).toString('base64url');
    const email = input.email.toLowerCase(); const whatsapp = input.whatsapp.replace(/[()\-\s]/g, '');
    await sql`insert into buzzerhood.public_campaign_requests(id,contact_name,email,whatsapp,organization_name,need_type,platform_target,brief,source_path,status_token_hash,ip_hash,user_agent_hash)
      values(${id},${input.contactName},${email},${whatsapp},${input.organizationName},${input.needType},${input.platformTarget},${input.brief},${input.sourcePath},${hash(token)},${hash(ip)},${userAgent ? hash(userAgent) : null})`.execute(this.database.db);
    this.logger.log({ event: 'public_campaign_request.created', requestId: id, needType: input.needType });
    await this.email.sendCampaignRequestReceived({ id, token, contactName: input.contactName, email, whatsapp, organizationName: input.organizationName, needType: input.needType, platformTarget: input.platformTarget, brief: input.brief });
    return { id, status: 'received' };
  }
  async status(token: string) {
    const result = await sql<{ status: string; created_at: Date; updated_at: Date }>`select status,created_at,updated_at from buzzerhood.public_campaign_requests where status_token_hash=${hash(token)}`.execute(this.database.db);
    if (!result.rows[0]) throw new ApiError(404, 'CAMPAIGN_REQUEST_NOT_FOUND', 'Status permintaan tidak ditemukan.');
    return { status: result.rows[0].status, createdAt: result.rows[0].created_at, updatedAt: result.rows[0].updated_at };
  }
}
