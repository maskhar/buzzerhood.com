import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { DatabaseService } from '../database/database.service.js';
import { ApiError } from '../errors/api-error.js';
import type { AuthenticatedRequest } from '../../modules/auth/auth.types.js';

@Injectable()
export class CampaignsManageGuard implements CanActivate {
  constructor(private readonly database: DatabaseService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const allowed = await this.database.withUserContext(request.authUser.id, async (tx) => {
      const result = await sql<{ allowed: boolean }>`select buzzerhood.has_permission('campaigns.manage') allowed`.execute(tx);
      return result.rows[0]?.allowed === true;
    });
    if (!allowed) throw new ApiError(403, 'PERMISSION_DENIED', 'Izin Campaign tidak mencukupi.');
    return true;
  }
}
