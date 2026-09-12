import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { DatabaseService } from '../../common/database/database.service.js';
import { ApiError } from '../../common/errors/api-error.js';
import type { AdminCampaignRequestQuery } from './admin-public-campaign-requests.schemas.js';
@Injectable()
export class AdminPublicCampaignRequestsService {
  constructor(private readonly database: DatabaseService) {}
  list(userId: string, query: AdminCampaignRequestQuery) { return this.database.withUserContext(userId, async tx => { const offset=(query.page-1)*query.limit; const where=query.status ? sql`where status=${query.status}` : sql`where status not in ('archived','converted')`; const rows=await sql`select id,contact_name,email,whatsapp,organization_name,need_type,platform_target,brief,source_path,status,review_note,reviewed_by,reviewed_at,converted_campaign_id,created_at,updated_at from buzzerhood.public_campaign_requests ${where} order by created_at desc limit ${query.limit} offset ${offset}`.execute(tx); return { data: rows.rows, meta: { page: query.page, limit: query.limit, hasNext: rows.rows.length === query.limit } }; }); }
  detail(userId: string, id: string) { return this.database.withUserContext(userId, async tx => { const result=await sql`select id,contact_name,email,whatsapp,organization_name,need_type,platform_target,brief,source_path,status,review_note,reviewed_by,reviewed_at,converted_campaign_id,created_at,updated_at from buzzerhood.public_campaign_requests where id=${id}`.execute(tx); if (!result.rows[0]) throw new ApiError(404,'CAMPAIGN_REQUEST_NOT_FOUND','Request campaign tidak ditemukan.'); return result.rows[0]; }); }
  async review(userId: string, id: string, note?: string) { return this.transition(userId,id,'in_review',note); }
  async reject(userId: string, id: string, note?: string) { return this.transition(userId,id,'rejected',note); }
  async archive(userId: string, id: string) { return this.database.withUserContext(userId, async tx => { const result=await sql`update buzzerhood.public_campaign_requests set status='archived',archived_at=now(),updated_at=now() where id=${id} and status<>'converted' returning id,status`.execute(tx); if (!result.rows[0]) throw new ApiError(404,'CAMPAIGN_REQUEST_NOT_FOUND','Request campaign tidak ditemukan.'); return result.rows[0]; }); }
  private async transition(userId: string, id: string, status: 'in_review'|'rejected', note?: string) { return this.database.withUserContext(userId, async tx => { const result=await sql`update buzzerhood.public_campaign_requests set status=${status},review_note=${note?.trim() || null},reviewed_by=${userId},reviewed_at=now(),updated_at=now() where id=${id} and status not in ('archived','converted') returning id,status`.execute(tx); if (!result.rows[0]) throw new ApiError(404,'CAMPAIGN_REQUEST_NOT_FOUND','Request campaign tidak ditemukan atau sudah final.'); return result.rows[0]; }); }
}
