import { Global, Module } from '@nestjs/common';
import { PasswordService } from './password.service.js';
import { TokenService } from './token.service.js';
import { PartnersManageGuard } from './partners-manage.guard.js';
import { CampaignsManageGuard } from './campaigns-manage.guard.js';
import { UsersManageGuard } from './users-manage.guard.js';

@Global()
@Module({ providers: [PasswordService, TokenService, PartnersManageGuard, CampaignsManageGuard, UsersManageGuard], exports: [PasswordService, TokenService, PartnersManageGuard, CampaignsManageGuard, UsersManageGuard] })
export class SecurityModule {}
