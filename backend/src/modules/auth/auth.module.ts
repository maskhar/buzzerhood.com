import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { CookieSecurityGuard } from './cookie-security.guard.js';

@Module({ controllers: [AuthController], providers: [AuthService, AuthGuard, CookieSecurityGuard], exports: [AuthGuard] })
export class AuthModule {}
