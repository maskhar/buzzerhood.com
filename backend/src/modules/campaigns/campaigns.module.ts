import { Module } from '@nestjs/common';
import { AdminCampaignsController } from './admin-campaigns.controller.js';
import { AdminCampaignsService } from './admin-campaigns.service.js';
import { CampaignExecutionController } from './campaign-execution.controller.js';
import { CampaignExecutionService } from './campaign-execution.service.js';
import { CampaignsController } from './campaigns.controller.js';
import { CampaignsService } from './campaigns.service.js';

@Module({ controllers:[CampaignsController,AdminCampaignsController,CampaignExecutionController],providers:[CampaignsService,AdminCampaignsService,CampaignExecutionService] })
export class CampaignsModule{}
