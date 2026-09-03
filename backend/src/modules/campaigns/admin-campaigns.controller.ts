import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CampaignsManageGuard } from '../../common/security/campaigns-manage.guard.js';
import { ZodValidationPipe } from '../../common/validation/zod-validation.pipe.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { AdminCampaignsService } from './admin-campaigns.service.js';
import { assignmentCreateSchema, campaignListSchema, deliverableCreateSchema, noteSchema, transitionSchema, type AssignmentCreate, type CampaignList, type DeliverableCreate, type NoteInput, type TransitionInput } from './campaigns.schemas.js';

@ApiTags('admin-campaigns') @ApiBearerAuth() @UseGuards(AuthGuard,CampaignsManageGuard) @Controller('admin')
export class AdminCampaignsController {
  constructor(private readonly campaigns:AdminCampaignsService){}
  @Get('campaigns') list(@Req() req:AuthenticatedRequest,@Query(new ZodValidationPipe(campaignListSchema)) query:CampaignList){return this.campaigns.list(req.authUser.id,query);}
  @Get('campaigns/:campaignId') detail(@Req() req:AuthenticatedRequest,@Param('campaignId',new ParseUUIDPipe()) id:string){return this.campaigns.detail(req.authUser.id,id);}
  @Post('campaigns/:campaignId/start-review') startReview(@Req() req:AuthenticatedRequest,@Param('campaignId',new ParseUUIDPipe()) id:string){return this.campaigns.startReview(req.authUser.id,id);}
  @Post('campaigns/:campaignId/approve') approve(@Req() req:AuthenticatedRequest,@Param('campaignId',new ParseUUIDPipe()) id:string){return this.campaigns.approve(req.authUser.id,id);}
  @Post('campaigns/:campaignId/request-revision') requestRevision(@Req() req:AuthenticatedRequest,@Param('campaignId',new ParseUUIDPipe()) id:string,@Body(new ZodValidationPipe(noteSchema)) body:NoteInput){return this.campaigns.requestRevision(req.authUser.id,id,body.note);}
  @Post('campaigns/:campaignId/transition') transition(@Req() req:AuthenticatedRequest,@Param('campaignId',new ParseUUIDPipe()) id:string,@Body(new ZodValidationPipe(transitionSchema)) body:TransitionInput){return this.campaigns.transition(req.authUser.id,id,body);}
  @Get('campaigns/:campaignId/assignments') assignments(@Req() req:AuthenticatedRequest,@Param('campaignId',new ParseUUIDPipe()) id:string){return this.campaigns.assignments(req.authUser.id,id);}
  @Post('campaigns/:campaignId/assignments') createAssignment(@Req() req:AuthenticatedRequest,@Param('campaignId',new ParseUUIDPipe()) id:string,@Body(new ZodValidationPipe(assignmentCreateSchema)) body:AssignmentCreate){return this.campaigns.createAssignment(req.authUser.id,id,body);}
  @Post('campaign-assignments/:assignmentId/deliverables') createDeliverable(@Req() req:AuthenticatedRequest,@Param('assignmentId',new ParseUUIDPipe()) id:string,@Body(new ZodValidationPipe(deliverableCreateSchema)) body:DeliverableCreate){return this.campaigns.createDeliverable(req.authUser.id,id,body);}
  @Post('content-submissions/:submissionId/approve') approveContent(@Req() req:AuthenticatedRequest,@Param('submissionId',new ParseUUIDPipe()) id:string,@Body(new ZodValidationPipe(noteSchema)) body:NoteInput){return this.campaigns.reviewContent(req.authUser.id,id,'approved',body.note);}
  @Post('content-submissions/:submissionId/request-revision') reviseContent(@Req() req:AuthenticatedRequest,@Param('submissionId',new ParseUUIDPipe()) id:string,@Body(new ZodValidationPipe(noteSchema)) body:NoteInput){return this.campaigns.reviewContent(req.authUser.id,id,'revision_requested',body.note);}
  @Post('publications/:publicationId/verify') verify(@Req() req:AuthenticatedRequest,@Param('publicationId',new ParseUUIDPipe()) id:string,@Body(new ZodValidationPipe(noteSchema)) body:NoteInput){return this.campaigns.verifyPublication(req.authUser.id,id,'verified',body.note);}
  @Post('publications/:publicationId/reject') reject(@Req() req:AuthenticatedRequest,@Param('publicationId',new ParseUUIDPipe()) id:string,@Body(new ZodValidationPipe(noteSchema)) body:NoteInput){return this.campaigns.verifyPublication(req.authUser.id,id,'rejected',body.note);}
}
