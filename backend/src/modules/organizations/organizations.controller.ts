import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../common/validation/zod-validation.pipe.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { createOrganizationSchema, updateOrganizationSchema, type CreateOrganizationInput, type UpdateOrganizationInput } from './organizations.schemas.js';
import { OrganizationsService } from './organizations.service.js';

@ApiTags('organizations') @ApiBearerAuth() @UseGuards(AuthGuard) @Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}
  @Get() list(@Req() request: AuthenticatedRequest) { return this.organizations.list(request.authUser.id); }
  @Post() create(@Req() request: AuthenticatedRequest, @Body(new ZodValidationPipe(createOrganizationSchema)) body: CreateOrganizationInput) { return this.organizations.create(request.authUser.id, body); }
  @Get(':organizationId') get(@Req() request: AuthenticatedRequest, @Param('organizationId', new ParseUUIDPipe()) id: string) { return this.organizations.get(request.authUser.id, id); }
  @Patch(':organizationId') update(@Req() request: AuthenticatedRequest, @Param('organizationId', new ParseUUIDPipe()) id: string, @Body(new ZodValidationPipe(updateOrganizationSchema)) body: UpdateOrganizationInput) { return this.organizations.update(request.authUser.id, id, body); }
  @Get(':organizationId/members') members(@Req() request: AuthenticatedRequest, @Param('organizationId', new ParseUUIDPipe()) id: string) { return this.organizations.members(request.authUser.id, id); }
}
