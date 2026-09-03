import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { WorkspacesService } from './workspaces.service.js';

@ApiTags('workspaces') @ApiBearerAuth() @UseGuards(AuthGuard) @Controller('me/workspaces')
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}
  @Get() list(@Req() request: AuthenticatedRequest) { return this.workspaces.list(request.authUser.id); }
}
