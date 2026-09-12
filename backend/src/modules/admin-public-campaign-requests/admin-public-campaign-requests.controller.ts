import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersManageGuard } from '../../common/security/users-manage.guard.js';
import { ZodValidationPipe } from '../../common/validation/zod-validation.pipe.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { adminCampaignRequestQuerySchema, campaignRequestReviewSchema, type AdminCampaignRequestQuery, type CampaignRequestReview } from './admin-public-campaign-requests.schemas.js';
import { AdminPublicCampaignRequestsService } from './admin-public-campaign-requests.service.js';
@ApiTags('admin-public-campaign-requests') @ApiBearerAuth() @UseGuards(AuthGuard, UsersManageGuard) @Controller('admin/public-campaign-requests')
export class AdminPublicCampaignRequestsController {
  constructor(private readonly requests: AdminPublicCampaignRequestsService) {}
  @Get() list(@Req() request: AuthenticatedRequest, @Query(new ZodValidationPipe(adminCampaignRequestQuerySchema)) query: AdminCampaignRequestQuery) { return this.requests.list(request.authUser.id, query); }
  @Get(':requestId') detail(@Req() request: AuthenticatedRequest, @Param('requestId', new ParseUUIDPipe()) id: string) { return this.requests.detail(request.authUser.id, id); }
  @Post(':requestId/review') review(@Req() request: AuthenticatedRequest, @Param('requestId', new ParseUUIDPipe()) id: string, @Body(new ZodValidationPipe(campaignRequestReviewSchema)) body: CampaignRequestReview) { return this.requests.review(request.authUser.id, id, body.note); }
  @Post(':requestId/reject') reject(@Req() request: AuthenticatedRequest, @Param('requestId', new ParseUUIDPipe()) id: string, @Body(new ZodValidationPipe(campaignRequestReviewSchema)) body: CampaignRequestReview) { return this.requests.reject(request.authUser.id, id, body.note); }
  @Post(':requestId/archive') archive(@Req() request: AuthenticatedRequest, @Param('requestId', new ParseUUIDPipe()) id: string) { return this.requests.archive(request.authUser.id, id); }
}
