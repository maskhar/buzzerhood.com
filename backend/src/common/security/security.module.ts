import { Global, Module } from '@nestjs/common';
import { PasswordService } from './password.service.js';
import { TokenService } from './token.service.js';
import { PartnersManageGuard } from './partners-manage.guard.js';
import { CampaignsManageGuard } from './campaigns-manage.guard.js';

@Global()
@Module({ providers: [PasswordService, TokenService, PartnersManageGuard, CampaignsManageGuard], exports: [PasswordService, TokenService, PartnersManageGuard, CampaignsManageGuard] })
export class SecurityModule {}
