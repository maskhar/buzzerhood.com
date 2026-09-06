import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EmailService } from '../../common/email/email.service.js';
import { PartnersManageGuard } from '../../common/security/partners-manage.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';

@ApiTags('admin-email') @ApiBearerAuth() @UseGuards(AuthGuard, PartnersManageGuard) @Controller('admin/email')
export class AdminEmailController {
  constructor(private readonly email: EmailService) {}
  @Get('diagnostics') diagnostics() { return this.email.diagnostics(); }
  @Post('test') test(@Req() request: AuthenticatedRequest) { return this.email.sendTestEmail(request.authUser.email); }
}
