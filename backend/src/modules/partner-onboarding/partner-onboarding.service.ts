import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'kysely';
import { DatabaseService } from '../../common/database/database.service.js';
import { ApiError } from '../../common/errors/api-error.js';
import { conflictFromDatabase, postgresMessage } from '../../common/errors/postgres-error.js';
import type { PartnerApplicationInput, PartnerClaimInput } from './partner-onboarding.schemas.js';

@Injectable()
export class PartnerOnboardingService {
  private readonly logger = new Logger(PartnerOnboardingService.name);
  constructor(private readonly database: DatabaseService) {}
  async createApplication(userId: string, input: PartnerApplicationInput) {
    try { return await this.database.withUserContext(userId, async (tx) => {
      const result = await sql<{ id: string }>`select buzzerhood.create_partner_application(${input.kind},${input.displayName},${input.partnerType ?? ''},${input.category ?? ''},${input.niche ?? ''},${input.location ?? ''},${input.bio ?? ''}) id`.execute(tx);
      const id=result.rows[0]?.id; if(!id) throw new Error('Application creation returned no identifier.');
      this.logger.log({ event: 'partner.application.created', actorId: userId, partnerId: id });
      return { id, status: 'pending' };
    }); } catch(error) { conflictFromDatabase(error,'PARTNER_APPLICATION_CONFLICT','Pengajuan Partner aktif sudah ada.'); }
  }
  listApplications(userId: string) { return this.database.withUserContext(userId, async (tx) => {
    const result=await sql<{ id:string;display_name:string;partner_kind:string;verification_status:string;created_at:Date }>`select p.id,p.display_name,p.partner_kind,p.verification_status,p.created_at from buzzerhood.partner_members m join buzzerhood.partners p on p.id=m.partner_id where m.profile_id=${userId} and m.role='owner' order by p.created_at desc`.execute(tx);
    return result.rows.map(r=>({id:r.id,displayName:r.display_name,kind:r.partner_kind,status:r.verification_status,createdAt:r.created_at}));
  }); }
  async createClaim(userId:string,input:PartnerClaimInput){
    try{return await this.database.withUserContext(userId,async(tx)=>{const result=await sql<{id:string}>`select buzzerhood.request_partner_claim(${input.partnerId},${input.evidence}) id`.execute(tx);const id=result.rows[0]?.id;if(!id)throw new Error('Claim creation returned no identifier.');this.logger.log({event:'partner.claim.created',actorId:userId,partnerId:input.partnerId,claimId:id});return{id,partnerId:input.partnerId,status:'pending'};});}
    catch(error){const message=postgresMessage(error);if(/unavailable/i.test(message))throw new ApiError(409,'PARTNER_ALREADY_CLAIMED','Partner tidak tersedia untuk klaim.');conflictFromDatabase(error,'PARTNER_CLAIM_CONFLICT','Klaim aktif untuk Partner ini sudah ada.');}
  }
  listClaims(userId:string){return this.database.withUserContext(userId,async(tx)=>{const result=await sql<{id:string;partner_id:string;display_name:string;status:string;review_note:string|null;created_at:Date;reviewed_at:Date|null}>`select c.id,c.partner_id,p.display_name,c.status,c.review_note,c.created_at,c.reviewed_at from buzzerhood.partner_claim_requests c join buzzerhood.partners p on p.id=c.partner_id where c.claimant_profile_id=${userId} order by c.created_at desc`.execute(tx);return result.rows.map(r=>({id:r.id,partnerId:r.partner_id,partnerDisplayName:r.display_name,status:r.status,reviewNote:r.review_note,createdAt:r.created_at,reviewedAt:r.reviewed_at}));});}
}
