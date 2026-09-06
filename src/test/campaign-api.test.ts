import { beforeEach,describe,expect,it,vi } from 'vitest';
const { apiRequest }=vi.hoisted(()=>({apiRequest:vi.fn()}));
vi.mock('@/lib/api/client',()=>({apiRequest}));
import { createCampaign,getClientCampaigns,respondToAssignment } from '@/features/campaigns/campaign-api';
describe('campaign Backend API adapter',()=>{
 beforeEach(()=>apiRequest.mockReset());
 it('creates a campaign through Backend API',async()=>{apiRequest.mockResolvedValue({id:'campaign-1'});await expect(createCampaign('org-1','Campaign Baru','Tujuan')).resolves.toBe('campaign-1');expect(apiRequest).toHaveBeenCalledWith('/campaigns',{method:'POST',body:{organizationId:'org-1',name:'Campaign Baru',objectiveSummary:'Tujuan'}});});
 it('maps campaign DTO to the existing frontend contract',async()=>{apiRequest.mockResolvedValue({data:[{id:'campaign-1',organizationId:'org-1',name:'Campaign',referenceCode:'REF-1',status:'draft',objectiveSummary:null,plannedStart:null,plannedEnd:null,estimatedBudget:1000,currency:'IDR',createdAt:'2026-09-06T00:00:00Z',updatedAt:'2026-09-06T00:00:00Z'}]});await expect(getClientCampaigns()).resolves.toEqual([{id:'campaign-1',organization_id:'org-1',name:'Campaign',reference_code:'REF-1',status:'draft',objective_summary:null,planned_start:null,planned_end:null,estimated_budget:1000,currency:'IDR',created_by:'',created_at:'2026-09-06T00:00:00Z',updated_at:'2026-09-06T00:00:00Z'}]);});
 it('uses assignment response endpoints',async()=>{apiRequest.mockResolvedValue({status:'accepted'});await expect(respondToAssignment('assignment-1','accepted')).resolves.toBe('accepted');expect(apiRequest).toHaveBeenCalledWith('/campaign-assignments/assignment-1/accept',{method:'POST',body:{note:undefined}});});
});
