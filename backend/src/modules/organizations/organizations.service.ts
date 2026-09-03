import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'kysely';
import { DatabaseService } from '../../common/database/database.service.js';
import { ApiError } from '../../common/errors/api-error.js';
import { conflictFromDatabase } from '../../common/errors/postgres-error.js';
import type { CreateOrganizationInput, UpdateOrganizationInput } from './organizations.schemas.js';

type OrganizationRow = { id: string; name: string; slug: string; kind: string; role: string };

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);
  constructor(private readonly database: DatabaseService) {}
  list(userId: string) { return this.database.withUserContext(userId, async (tx) => {
    const result = await sql<OrganizationRow>`select o.id,o.name,o.slug,o.kind::text,m.role::text role from buzzerhood.organizations o join buzzerhood.organization_members m on m.organization_id=o.id where m.profile_id=${userId} and m.status='active' order by o.name`.execute(tx);
    return result.rows.map((row) => this.dto(row));
  }); }
  async create(userId: string, input: CreateOrganizationInput) {
    try {
      return await this.database.withUserContext(userId, async (tx) => {
        const created = await sql<{ id: string }>`select buzzerhood.create_client_organization(${input.name},${input.slug}) id`.execute(tx);
        this.logger.log({ event: 'organization.created', actorId: userId, organizationId: created.rows[0]?.id });
        return this.getInTransaction(tx, created.rows[0]?.id ?? '');
      });
    } catch (error) { conflictFromDatabase(error, 'ORG_CONFLICT', 'Nama atau slug organisasi sudah digunakan.'); }
  }
  get(userId: string, id: string) { return this.database.withUserContext(userId, (tx) => this.getInTransaction(tx, id)); }
  async update(userId: string, id: string, input: UpdateOrganizationInput) {
    try {
      return await this.database.withUserContext(userId, async (tx) => {
        const result = await sql<{ id: string }>`update buzzerhood.organizations set name=coalesce(${input.name ?? null},name),slug=coalesce(${input.slug ?? null},slug),updated_at=now() where id=${id} returning id`.execute(tx);
        if (!result.rows[0]) throw new ApiError(404, 'ORG_NOT_FOUND', 'Organisasi tidak ditemukan.');
        this.logger.log({ event: 'organization.updated', actorId: userId, organizationId: id });
        return this.getInTransaction(tx, id);
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      conflictFromDatabase(error, 'ORG_CONFLICT', 'Nama atau slug organisasi sudah digunakan.');
    }
  }
  members(userId: string, id: string) { return this.database.withUserContext(userId, async (tx) => {
    await this.getInTransaction(tx, id);
    const result = await sql<{ id: string; display_name: string | null; role: string; status: string }>`select m.id,p.display_name,m.role::text role,m.status::text status from buzzerhood.organization_members m join buzzerhood.profiles p on p.id=m.profile_id where m.organization_id=${id} order by m.created_at`.execute(tx);
    return result.rows.map((row) => ({ membershipId: row.id, displayName: row.display_name, role: row.role, status: row.status }));
  }); }
  private async getInTransaction(tx: Parameters<Parameters<DatabaseService['withUserContext']>[1]>[0], id: string) {
    const result = await sql<OrganizationRow>`select o.id,o.name,o.slug,o.kind::text,coalesce(m.role::text,'') role from buzzerhood.organizations o left join buzzerhood.organization_members m on m.organization_id=o.id and m.profile_id=buzzerhood.current_user_id() and m.status='active' where o.id=${id}`.execute(tx);
    if (!result.rows[0]) throw new ApiError(404, 'ORG_NOT_FOUND', 'Organisasi tidak ditemukan.');
    return this.dto(result.rows[0]);
  }
  private dto(row: OrganizationRow) { return { id: row.id, name: row.name, slug: row.slug, kind: row.kind, membershipRole: row.role }; }
}
