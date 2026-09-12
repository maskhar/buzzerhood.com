import { Body, Controller, Get, HttpCode, Post, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { FastifyRequest } from 'fastify';
import { ZodValidationPipe } from '../../common/validation/zod-validation.pipe.js';
import { campaignRequestStatusSchema, publicCampaignRequestSchema, type CampaignRequestStatusInput, type PublicCampaignRequestInput } from './public-campaign-requests.schemas.js';
import { PublicCampaignRequestsService } from './public-campaign-requests.service.js';

@Controller('public/campaign-requests')
export class PublicCampaignRequestsController {
  constructor(private readonly requests: PublicCampaignRequestsService) {}
  @Post() @Throttle({ default: { limit: 3, ttl: 3_600_000 } }) @HttpCode(201)
  create(@Body(new ZodValidationPipe(publicCampaignRequestSchema)) input: PublicCampaignRequestInput, @Req() request: FastifyRequest) {
    if (input.website) return { status: 'received' };
    return this.requests.create(input, request.ip, request.headers['user-agent']);
  }
  @Get('status') @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  status(@Query(new ZodValidationPipe(campaignRequestStatusSchema)) query: CampaignRequestStatusInput) { return this.requests.status(query.token); }
}
