import { Module } from '@nestjs/common';
import { PublicPartnerApplicationsController } from './public-partner-applications.controller.js';
import { PublicPartnerApplicationsService } from './public-partner-applications.service.js';

@Module({ controllers: [PublicPartnerApplicationsController], providers: [PublicPartnerApplicationsService] })
export class PublicPartnerApplicationsModule {}
