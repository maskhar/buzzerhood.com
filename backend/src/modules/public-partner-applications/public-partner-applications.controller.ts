import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ZodValidationPipe } from '../../common/validation/zod-validation.pipe.js';
import { publicPartnerApplicationSchema, type PublicPartnerApplicationInput } from './public-partner-applications.schemas.js';
import { PublicPartnerApplicationsService } from './public-partner-applications.service.js';

@Controller('public/partner-applications')
export class PublicPartnerApplicationsController {
  constructor(private readonly applications: PublicPartnerApplicationsService) {}

  @Post()
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @HttpCode(201)
  create(@Body(new ZodValidationPipe(publicPartnerApplicationSchema)) input: PublicPartnerApplicationInput) {
    if (input.website) return { status: 'received' };
    return this.applications.create(input);
  }
}
