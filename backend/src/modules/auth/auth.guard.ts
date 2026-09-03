import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { sql } from 'kysely';
import { ApiError } from '../../common/errors/api-error.js';
import { DatabaseService } from '../../common/database/database.service.js';
import { TokenService } from '../../common/security/token.service.js';
import type { AuthenticatedRequest } from './auth.types.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService, private readonly database: DatabaseService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new ApiError(401, 'AUTH_REQUIRED', 'Autentikasi diperlukan.');
    const identity = await this.tokens.verifyAccess(header.slice(7));
    const user = await this.database.withUserContext(identity.userId, async (transaction) => {
      const result = await sql<{ id: string; email: string; status: string; password_changed_at: Date }>`
        select id, email, status, password_changed_at from buzzerhood.users where id = ${identity.userId}
      `.execute(transaction);
      return result.rows[0];
    });
    if (!user || user.status !== 'active' || Math.floor(new Date(user.password_changed_at).getTime() / 1000) > identity.issuedAt) {
      throw new ApiError(401, 'AUTH_INVALID_TOKEN', 'Token akses tidak valid.');
    }
    (request as AuthenticatedRequest).authUser = { id: user.id, email: user.email };
    return true;
  }
}
