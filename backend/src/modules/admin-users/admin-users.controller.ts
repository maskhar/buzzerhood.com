import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UsersManageGuard } from '../../common/security/users-manage.guard.js';
import { ZodValidationPipe } from '../../common/validation/zod-validation.pipe.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { AdminUsersService } from './admin-users.service.js';
import { createAdminUserSchema, type CreateAdminUserInput } from './admin-users.schemas.js';
@ApiTags('admin-users') @ApiBearerAuth() @UseGuards(AuthGuard,UsersManageGuard) @Controller('admin/users') export class AdminUsersController { constructor(private readonly users:AdminUsersService){} @Get() list(@Req() r:AuthenticatedRequest){return this.users.list(r.authUser.id)} @Post() @Throttle({default:{limit:10,ttl:3_600_000}}) create(@Req() r:AuthenticatedRequest,@Body(new ZodValidationPipe(createAdminUserSchema)) b:CreateAdminUserInput){return this.users.create(r.authUser.id,b)} @Post(':id/disable') disable(@Req() r:AuthenticatedRequest,@Param('id',new ParseUUIDPipe()) id:string){return this.users.status(r.authUser.id,id,'disabled')} @Post(':id/activate') activate(@Req() r:AuthenticatedRequest,@Param('id',new ParseUUIDPipe()) id:string){return this.users.status(r.authUser.id,id,'active')} @Post(':id/reset-password') @Throttle({default:{limit:10,ttl:3_600_000}}) resetPassword(@Req() r:AuthenticatedRequest,@Param('id',new ParseUUIDPipe()) id:string){return this.users.resetPassword(r.authUser.id,id)} @Delete(':id') delete(@Req() r:AuthenticatedRequest,@Param('id',new ParseUUIDPipe()) id:string){return this.users.delete(r.authUser.id,id)} }
