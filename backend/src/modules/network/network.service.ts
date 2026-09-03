import { Injectable } from '@nestjs/common';
import { sql, type RawBuilder } from 'kysely';
import { DatabaseService } from '../../common/database/database.service.js';
import type { NetworkQuery } from './network.schemas.js';

export type PublicRow = { id: string; display_name: string; partner_type: string | null; tier: string | null; category: string | null; niche: string | null; platform: string; handle: string | null; metric_type: string | null; metric_value: string | null; observed_at: Date | null };

export function toPublicPartner(row: PublicRow) {
  return { id: row.id, displayName: row.display_name, partnerType: row.partner_type, tier: row.tier, category: row.category, niche: row.niche, platform: row.platform, handle: row.handle, metricType: row.metric_type, metricValue: row.metric_value === null ? null : Number(row.metric_value), observedAt: row.observed_at };
}

@Injectable()
export class NetworkService {
  constructor(private readonly database: DatabaseService) {}
  async list(query: NetworkQuery) {
    const filters: RawBuilder<unknown>[] = [sql`true`];
    if (query.search) filters.push(sql`(display_name ilike ${`%${query.search}%`} or coalesce(handle,'') ilike ${`%${query.search}%`} or platform ilike ${`%${query.search}%`} or coalesce(niche,'') ilike ${`%${query.search}%`})`);
    if (query.platform) filters.push(sql`lower(platform)=lower(${query.platform})`);
    if (query.tier) filters.push(sql`lower(coalesce(tier,''))=lower(${query.tier})`);
    if (query.niche) filters.push(sql`lower(coalesce(niche,''))=lower(${query.niche})`);
    const where = sql.join(filters, sql` and `); const offset = (query.page - 1) * query.limit;
    const count = await sql<{ total: string }>`select count(*)::text total from buzzerhood.public_network_partners where ${where}`.execute(this.database.db);
    const rows = await sql<PublicRow>`select id,display_name,partner_type,tier,category,niche,platform,handle,metric_type::text,metric_value::text,observed_at from buzzerhood.public_network_partners where ${where} order by display_name,id limit ${query.limit} offset ${offset}`.execute(this.database.db);
    const total = Number(count.rows[0]?.total ?? 0);
    return { data: rows.rows.map(toPublicPartner), meta: { page: query.page, limit: query.limit, total, hasNext: offset + rows.rows.length < total } };
  }
}
