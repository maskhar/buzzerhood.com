import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AdminPublicPartnerApplicationsController } from './admin-public-partner-applications.controller.js';
import { AdminPublicPartnerApplicationsService } from './admin-public-partner-applications.service.js';

@Module({ imports: [AuthModule], controllers: [AdminPublicPartnerApplicationsController], providers: [AdminPublicPartnerApplicationsService] })
export class AdminPublicPartnerApplicationsModule {}
