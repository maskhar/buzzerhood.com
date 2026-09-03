import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../common/validation/zod-validation.pipe.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { CampaignsService } from './campaigns.service.js';
import { campaignListSchema, createCampaignSchema, updateCampaignSchema, type CampaignList, type CreateCampaign, type UpdateCampaign } from './campaigns.schemas.js';

@ApiTags('campaigns') @ApiBearerAuth() @UseGuards(AuthGuard) @Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaigns:CampaignsService){}
  @Get() list(@Req() req:AuthenticatedRequest,@Query(new ZodValidationPipe(campaignListSchema)) query:CampaignList){return this.campaigns.list(req.authUser.id,query);}
  @Post() create(@Req() req:AuthenticatedRequest,@Body(new ZodValidationPipe(createCampaignSchema)) body:CreateCampaign){return this.campaigns.create(req.authUser.id,body);}
  @Get(':campaignId') get(@Req() req:AuthenticatedRequest,@Param('campaignId',new ParseUUIDPipe()) id:string){return this.campaigns.get(req.authUser.id,id);}
  @Patch(':campaignId') update(@Req() req:AuthenticatedRequest,@Param('campaignId',new ParseUUIDPipe()) id:string,@Body(new ZodValidationPipe(updateCampaignSchema)) body:UpdateCampaign){return this.campaigns.update(req.authUser.id,id,body);}
  @Post(':campaignId/submit') submit(@Req() req:AuthenticatedRequest,@Param('campaignId',new ParseUUIDPipe()) id:string){return this.campaigns.submit(req.authUser.id,id);}
}
