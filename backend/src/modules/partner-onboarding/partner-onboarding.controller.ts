import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../common/validation/zod-validation.pipe.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { partnerApplicationSchema,partnerClaimSchema,type PartnerApplicationInput,type PartnerClaimInput } from './partner-onboarding.schemas.js';
import { PartnerOnboardingService } from './partner-onboarding.service.js';

@ApiTags('partner-onboarding') @ApiBearerAuth() @UseGuards(AuthGuard)
@Controller()
export class PartnerOnboardingController{
  constructor(private readonly onboarding:PartnerOnboardingService){}
  @Post('partner-applications') createApplication(@Req()r:AuthenticatedRequest,@Body(new ZodValidationPipe(partnerApplicationSchema))b:PartnerApplicationInput){return this.onboarding.createApplication(r.authUser.id,b);}
  @Get('me/partner-applications') applications(@Req()r:AuthenticatedRequest){return this.onboarding.listApplications(r.authUser.id);}
  @Post('partner-claims') createClaim(@Req()r:AuthenticatedRequest,@Body(new ZodValidationPipe(partnerClaimSchema))b:PartnerClaimInput){return this.onboarding.createClaim(r.authUser.id,b);}
  @Get('me/partner-claims') claims(@Req()r:AuthenticatedRequest){return this.onboarding.listClaims(r.authUser.id);}
}
