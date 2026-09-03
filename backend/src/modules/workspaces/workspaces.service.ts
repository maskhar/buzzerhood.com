import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { DatabaseService } from '../../common/database/database.service.js';

@Injectable()
export class WorkspacesService {
  constructor(private readonly database: DatabaseService) {}
  async list(userId: string) {
    return this.database.withUserContext(userId, async (tx) => {
      const clients = await sql<{ id: string; name: string; role: string }>`select o.id,o.name,m.role::text role from buzzerhood.organization_members m join buzzerhood.organizations o on o.id=m.organization_id where m.profile_id=${userId} and m.status='active' and o.kind='client' order by o.name`.execute(tx);
      const partners = await sql<{ id: string; display_name: string; role: string; status: string }>`select p.id,p.display_name,m.role::text role,m.status::text status from buzzerhood.partner_members m join buzzerhood.partners p on p.id=m.partner_id where m.profile_id=${userId} and m.status='active' order by p.display_name`.execute(tx);
      const capability = await sql<{ admin: boolean }>`select buzzerhood.has_permission('partners.manage') admin`.execute(tx);
      return {
        client: clients.rows.map((row) => ({ organizationId: row.id, name: row.name, role: row.role })),
        partner: partners.rows.map((row) => ({ partnerId: row.id, displayName: row.display_name, role: row.role, status: row.status })),
        admin: capability.rows[0]?.admin === true
      };
    });
  }
}
