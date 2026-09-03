import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ZodValidationPipe } from '../../common/validation/zod-validation.pipe.js';
import { networkQuerySchema, type NetworkQuery } from './network.schemas.js';
import { NetworkService } from './network.service.js';
@ApiTags('network') @Controller('network')
export class NetworkController {
  constructor(private readonly network: NetworkService) {}
  @Get() @Throttle({ default: { limit: 100, ttl: 60_000 } })
  list(@Query(new ZodValidationPipe(networkQuerySchema)) query: NetworkQuery) { return this.network.list(query); }
}
