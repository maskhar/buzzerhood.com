import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PartnersManageGuard } from '../../common/security/partners-manage.guard.js';
import { ZodValidationPipe } from '../../common/validation/zod-validation.pipe.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { adminPublicPartnerApplicationQuerySchema, publicPartnerApplicationReviewSchema, type AdminPublicPartnerApplicationQuery, type PublicPartnerApplicationReview } from './admin-public-partner-applications.schemas.js';
import { AdminPublicPartnerApplicationsService } from './admin-public-partner-applications.service.js';

@ApiTags('admin-public-partner-applications')
@ApiBearerAuth()
@UseGuards(AuthGuard, PartnersManageGuard)
@Controller('admin/public-partner-applications')
export class AdminPublicPartnerApplicationsController {
  constructor(private readonly applications: AdminPublicPartnerApplicationsService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest, @Query(new ZodValidationPipe(adminPublicPartnerApplicationQuerySchema)) query: AdminPublicPartnerApplicationQuery) {
    return this.applications.list(request.authUser.id, query);
  }

  @Get(':applicationId')
  detail(@Req() request: AuthenticatedRequest, @Param('applicationId', new ParseUUIDPipe()) applicationId: string) {
    return this.applications.detail(request.authUser.id, applicationId);
  }

  @Post(':applicationId/approve')
  approve(@Req() request: AuthenticatedRequest, @Param('applicationId', new ParseUUIDPipe()) applicationId: string, @Body(new ZodValidationPipe(publicPartnerApplicationReviewSchema)) body: PublicPartnerApplicationReview) {
    return this.applications.review(request.authUser.id, applicationId, 'approved', body.note);
  }

  @Post(':applicationId/reject')
  reject(@Req() request: AuthenticatedRequest, @Param('applicationId', new ParseUUIDPipe()) applicationId: string, @Body(new ZodValidationPipe(publicPartnerApplicationReviewSchema)) body: PublicPartnerApplicationReview) {
    return this.applications.review(request.authUser.id, applicationId, 'rejected', body.note);
  }
}
