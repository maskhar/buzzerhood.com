import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { DatabaseService } from '../database/database.service.js';
import { ApiError } from '../errors/api-error.js';
import type { AuthenticatedRequest } from '../../modules/auth/auth.types.js';
@Injectable() export class UsersManageGuard implements CanActivate {
  constructor(private readonly database: DatabaseService) {}
  async canActivate(context: ExecutionContext) { const request=context.switchToHttp().getRequest<AuthenticatedRequest>(); const result=await this.database.withUserContext(request.authUser.id,(tx)=>sql<{allowed:boolean}>`select buzzerhood.has_permission('users.manage') allowed`.execute(tx)); if(result.rows[0]?.allowed!==true) throw new ApiError(403,'PERMISSION_DENIED','Izin tidak mencukupi.'); return true; }
}
