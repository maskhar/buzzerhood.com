import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { DatabaseService } from '../../common/database/database.service.js';

@SkipThrottle()
@Controller()
export class HealthController {
  constructor(private readonly database: DatabaseService) {}
  @Get('health') health() { return { status: 'ok' }; }
  @Get('ready') async ready() {
    try { await this.database.ready(); return { status: 'ok' }; }
    catch { throw new ServiceUnavailableException({ error: { code: 'SERVICE_NOT_READY', message: 'Layanan belum siap.' } }); }
  }
}
