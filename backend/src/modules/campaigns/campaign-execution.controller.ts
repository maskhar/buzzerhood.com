import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../common/validation/zod-validation.pipe.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { CampaignExecutionService } from './campaign-execution.service.js';
import { metricCreateSchema, noteSchema, publicationCreateSchema, submissionCreateSchema, type MetricCreate, type NoteInput, type PublicationCreate, type SubmissionCreate } from './campaigns.schemas.js';

@ApiTags('campaign-execution') @ApiBearerAuth() @UseGuards(AuthGuard) @Controller()
export class CampaignExecutionController {
  constructor(private readonly execution:CampaignExecutionService){}
  @Get('me/campaign-assignments') listMine(@Req() req:AuthenticatedRequest){return this.execution.listMine(req.authUser.id);}
  @Get('campaign-assignments/:assignmentId') assignment(@Req() req:AuthenticatedRequest,@Param('assignmentId',new ParseUUIDPipe()) id:string){return this.execution.getAssignment(req.authUser.id,id);}
  @Post('campaign-assignments/:assignmentId/accept') accept(@Req() req:AuthenticatedRequest,@Param('assignmentId',new ParseUUIDPipe()) id:string){return this.execution.respond(req.authUser.id,id,'accepted');}
  @Post('campaign-assignments/:assignmentId/reject') reject(@Req() req:AuthenticatedRequest,@Param('assignmentId',new ParseUUIDPipe()) id:string,@Body(new ZodValidationPipe(noteSchema)) body:NoteInput){return this.execution.respond(req.authUser.id,id,'declined',body.note);}
  @Get('campaign-assignments/:assignmentId/deliverables') deliverables(@Req() req:AuthenticatedRequest,@Param('assignmentId',new ParseUUIDPipe()) id:string){return this.execution.deliverables(req.authUser.id,id);}
  @Get('deliverables/:deliverableId/submissions') submissions(@Req() req:AuthenticatedRequest,@Param('deliverableId',new ParseUUIDPipe()) id:string){return this.execution.submissions(req.authUser.id,id);}
  @Post('deliverables/:deliverableId/submissions') submit(@Req() req:AuthenticatedRequest,@Param('deliverableId',new ParseUUIDPipe()) id:string,@Body(new ZodValidationPipe(submissionCreateSchema)) body:SubmissionCreate){return this.execution.submitContent(req.authUser.id,id,body);}
  @Post('content-submissions/:submissionId/approve') approve(@Req() req:AuthenticatedRequest,@Param('submissionId',new ParseUUIDPipe()) id:string,@Body(new ZodValidationPipe(noteSchema)) body:NoteInput){return this.execution.clientReview(req.authUser.id,id,'approved',body.note);}
  @Post('content-submissions/:submissionId/request-revision') revise(@Req() req:AuthenticatedRequest,@Param('submissionId',new ParseUUIDPipe()) id:string,@Body(new ZodValidationPipe(noteSchema)) body:NoteInput){return this.execution.clientReview(req.authUser.id,id,'revision_requested',body.note);}
  @Post('deliverables/:deliverableId/publications') publish(@Req() req:AuthenticatedRequest,@Param('deliverableId',new ParseUUIDPipe()) id:string,@Body(new ZodValidationPipe(publicationCreateSchema)) body:PublicationCreate){return this.execution.publish(req.authUser.id,id,body);}
  @Get('publications/:publicationId/metrics') metrics(@Req() req:AuthenticatedRequest,@Param('publicationId',new ParseUUIDPipe()) id:string){return this.execution.metrics(req.authUser.id,id);}
  @Post('publications/:publicationId/metrics') recordMetric(@Req() req:AuthenticatedRequest,@Param('publicationId',new ParseUUIDPipe()) id:string,@Body(new ZodValidationPipe(metricCreateSchema)) body:MetricCreate){return this.execution.recordMetric(req.authUser.id,id,body);}
}
