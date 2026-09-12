import { Module } from '@nestjs/common';
import { AdminPublicCampaignRequestsController } from './admin-public-campaign-requests.controller.js';
import { AdminPublicCampaignRequestsService } from './admin-public-campaign-requests.service.js';
@Module({ controllers: [AdminPublicCampaignRequestsController], providers: [AdminPublicCampaignRequestsService] })
export class AdminPublicCampaignRequestsModule {}
