import { Body, Controller, Get, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { APP_CONFIGURATION } from '../../common/config/configuration.module.js';
import type { AppConfiguration } from '../../common/config/configuration.js';
import { ZodValidationPipe } from '../../common/validation/zod-validation.pipe.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { CookieSecurityGuard } from './cookie-security.guard.js';
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from './auth.schemas.js';
import type { AuthenticatedRequest, AuthResult } from './auth.types.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService, @Inject(APP_CONFIGURATION) private readonly config: AppConfiguration) {}

  @Post('register') @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body(new ZodValidationPipe(registerSchema)) input: RegisterInput, @Res({ passthrough: true }) reply: FastifyReply) {
    return this.publish(await this.auth.register(input), reply);
  }

  @Post('login') @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(@Body(new ZodValidationPipe(loginSchema)) input: LoginInput, @Res({ passthrough: true }) reply: FastifyReply) {
    return this.publish(await this.auth.login(input), reply);
  }

  @Post('refresh') @UseGuards(CookieSecurityGuard) @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async refresh(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    return this.publish(await this.auth.refresh(request.cookies[this.config.refresh.cookieName]), reply);
  }

  @Post('logout') @UseGuards(CookieSecurityGuard)
  async logout(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    await this.auth.logout(request.cookies[this.config.refresh.cookieName]); this.clear(reply); return { success: true };
  }

  @Post('logout-all') @UseGuards(AuthGuard, CookieSecurityGuard) @ApiBearerAuth()
  async logoutAll(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    await this.auth.logoutAll(request.authUser.id); this.clear(reply); return { success: true };
  }

  @Get('me') @UseGuards(AuthGuard) @ApiBearerAuth()
  me(@Req() request: AuthenticatedRequest) { return this.auth.me(request.authUser); }

  private publish(result: AuthResult, reply: FastifyReply) {
    const options = { path: '/api/v1/auth', secure: this.config.refresh.secure, sameSite: this.config.refresh.sameSite, maxAge: this.config.refresh.ttlSeconds } as const;
    reply.setCookie(this.config.refresh.cookieName, result.refreshToken, { ...options, httpOnly: true });
    reply.setCookie(this.config.refresh.csrfCookieName, result.csrfToken, { ...options, httpOnly: false });
    return { accessToken: result.accessToken, tokenType: result.tokenType, expiresIn: result.expiresIn, csrfToken: result.csrfToken };
  }
  private clear(reply: FastifyReply) {
    const options = { path: '/api/v1/auth', secure: this.config.refresh.secure, sameSite: this.config.refresh.sameSite } as const;
    reply.clearCookie(this.config.refresh.cookieName, { ...options, httpOnly: true });
    reply.clearCookie(this.config.refresh.csrfCookieName, { ...options, httpOnly: false });
  }
}
