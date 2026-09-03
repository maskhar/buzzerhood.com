import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import { APP_CONFIGURATION } from '../../common/config/configuration.module.js';
import type { AppConfiguration } from '../../common/config/configuration.js';
import { ApiError } from '../../common/errors/api-error.js';

@Injectable()
export class CookieSecurityGuard implements CanActivate {
  constructor(@Inject(APP_CONFIGURATION) private readonly config: AppConfiguration) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const origin = request.headers.origin;
    if (!origin || !this.config.corsOrigins.includes(origin)) throw new ApiError(403, 'AUTH_ORIGIN_REJECTED', 'Origin permintaan tidak diizinkan.');
    const cookie = request.cookies[this.config.refresh.csrfCookieName];
    const header = request.headers['x-csrf-token'];
    if (!cookie || typeof header !== 'string') throw new ApiError(403, 'AUTH_CSRF_REJECTED', 'Token CSRF tidak valid.');
    const left = Buffer.from(cookie); const right = Buffer.from(header);
    if (left.length !== right.length || !timingSafeEqual(left, right)) throw new ApiError(403, 'AUTH_CSRF_REJECTED', 'Token CSRF tidak valid.');
    return true;
  }
}
