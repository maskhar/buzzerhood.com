import { Module } from '@nestjs/common';
import { PublicCampaignRequestsController } from './public-campaign-requests.controller.js';
import { PublicCampaignRequestsService } from './public-campaign-requests.service.js';
@Module({ controllers: [PublicCampaignRequestsController], providers: [PublicCampaignRequestsService] })
export class PublicCampaignRequestsModule {}
