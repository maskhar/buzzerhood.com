import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UsersManageGuard } from '../../common/security/users-manage.guard.js';
import { ZodValidationPipe } from '../../common/validation/zod-validation.pipe.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { AdminUsersService } from './admin-users.service.js';
import { createAdminUserSchema, updateAdminUserRoleSchema, type CreateAdminUserInput, type UpdateAdminUserRoleInput } from './admin-users.schemas.js';

@ApiTags('admin-users') @ApiBearerAuth() @UseGuards(AuthGuard, UsersManageGuard) @Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}
  @Get() list(@Req() request: AuthenticatedRequest) { return this.users.list(request.authUser.id); }
  @Post() @Throttle({ default: { limit: 10, ttl: 3_600_000 } }) create(@Req() request: AuthenticatedRequest, @Body(new ZodValidationPipe(createAdminUserSchema)) input: CreateAdminUserInput) { return this.users.create(request.authUser.id, input); }
  @Post(':id/role') updateRole(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string, @Body(new ZodValidationPipe(updateAdminUserRoleSchema)) input: UpdateAdminUserRoleInput) { return this.users.role(request.authUser.id, id, input.role); }
  @Post(':id/disable') disable(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) { return this.users.status(request.authUser.id, id, 'disabled'); }
  @Post(':id/activate') activate(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) { return this.users.status(request.authUser.id, id, 'active'); }
  @Post(':id/reset-password') @Throttle({ default: { limit: 10, ttl: 3_600_000 } }) resetPassword(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) { return this.users.resetPassword(request.authUser.id, id); }
  @Delete(':id') delete(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) { return this.users.delete(request.authUser.id, id); }
}
