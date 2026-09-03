import { generateKeyPairSync, randomUUID } from 'node:crypto';
import cookie from '@fastify/cookie';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module.js';
import type { AppConfiguration } from '../../src/common/config/configuration.js';
import { ApiExceptionFilter } from '../../src/common/errors/api-exception.filter.js';

const databaseUrl=process.env.TEST_DATABASE_URL,adminUrl=process.env.TEST_ADMIN_DATABASE_URL;
if(!databaseUrl||!adminUrl)throw new Error('B3 test database URLs are required.');
function config():AppConfiguration{const pair=generateKeyPairSync('ed25519');return{environment:'test',host:'127.0.0.1',port:3100,database:{url:databaseUrl!,poolMin:0,poolMax:1,connectionTimeoutMs:5000,queryTimeoutMs:10000},jwt:{issuer:'https://auth.test.buzzerhood.invalid',audience:'buzzerhood-test',accessTtlSeconds:600,keyId:'b3-test',privateKeyPem:pair.privateKey.export({format:'pem',type:'pkcs8'}).toString(),publicKeyPem:pair.publicKey.export({format:'pem',type:'spki'}).toString()},refresh:{ttlSeconds:3600,cookieName:'buzzerhood_refresh',csrfCookieName:'buzzerhood_csrf',secure:false,sameSite:'lax'},corsOrigins:['https://test.buzzerhood.invalid'],registrationMode:'open',rateLimit:{ttlMs:60000,max:2000},swaggerEnabled:false,logLevel:'silent'};}
type Identity={id:string;token:string};

describe('B3 Campaign API workflow and isolation',()=>{
  let app:NestFastifyApplication,admin:Pool;const password='correct horse battery staple';
  let clientA:Identity,clientB:Identity,partnerA:Identity,partnerB:Identity,reviewer:Identity;
  let orgA:string,orgB:string,partnerIdA:string,partnerIdB:string,campaignA:string,campaignB:string,assignmentA:string,assignmentB:string,deliverableA:string,deliverableB:string,submissionV1:string,submissionV2:string,publication:string;
  const auth=(identity:Identity)=>({authorization:`Bearer ${identity.token}`});
  async function register(label:string):Promise<Identity>{const response=await app.inject({method:'POST',url:'/api/v1/auth/register',payload:{email:`${label}-${randomUUID()}@example.com`,password,displayName:label}});expect(response.statusCode).toBe(201);const token=response.json<{accessToken:string}>().accessToken;const me=await app.inject({method:'GET',url:'/api/v1/auth/me',headers:{authorization:`Bearer ${token}`}});return{id:me.json<{id:string}>().id,token};}
  async function createOrganization(owner:Identity,name:string){const response=await app.inject({method:'POST',url:'/api/v1/organizations',headers:auth(owner),payload:{name,slug:`${name.toLowerCase().replaceAll(' ','-')}-${randomUUID().slice(0,8)}`}});expect(response.statusCode).toBe(201);return response.json<{id:string}>().id;}
  async function createPartner(owner:Identity,name:string){const response=await app.inject({method:'POST',url:'/api/v1/partner-applications',headers:auth(owner),payload:{kind:'individual',displayName:name,partnerType:'Influencer',niche:'Technology'}});expect(response.statusCode).toBe(201);const id=response.json<{id:string}>().id;const approval=await app.inject({method:'POST',url:`/api/v1/admin/partner-applications/${id}/approve`,headers:auth(reviewer),payload:{note:'B3 fixture'}});expect(approval.statusCode).toBe(201);return id;}

  beforeAll(async()=>{app=await NestFactory.create<NestFastifyApplication>(AppModule.register(config()),new FastifyAdapter({logger:false}));await app.register(cookie);app.useGlobalFilters(new ApiExceptionFilter());app.setGlobalPrefix('api/v1',{exclude:['health','ready']});await app.init();await app.getHttpAdapter().getInstance().ready();admin=new Pool({connectionString:adminUrl});clientA=await register('client-a');clientB=await register('client-b');partnerA=await register('partner-a');partnerB=await register('partner-b');reviewer=await register('reviewer');await admin.query("insert into buzzerhood.user_roles(profile_id,role_id) select $1,id from buzzerhood.roles where key='internal_team'",[reviewer.id]);orgA=await createOrganization(clientA,'Campaign Client A');orgB=await createOrganization(clientB,'Campaign Client B');partnerIdA=await createPartner(partnerA,'Campaign Partner A');partnerIdB=await createPartner(partnerB,'Campaign Partner B');});
  afterAll(async()=>{await admin.end();await app.close();});

  it('creates, edits, submits, and isolates Client Campaigns',async()=>{
    const createdA=await app.inject({method:'POST',url:'/api/v1/campaigns',headers:auth(clientA),payload:{organizationId:orgA,name:'Launch A',objectiveSummary:'Launch product A'}});expect(createdA.statusCode).toBe(201);campaignA=createdA.json<{id:string}>().id;
    const createdB=await app.inject({method:'POST',url:'/api/v1/campaigns',headers:auth(clientB),payload:{organizationId:orgB,name:'Launch B'}});expect(createdB.statusCode).toBe(201);campaignB=createdB.json<{id:string}>().id;
    expect((await app.inject({method:'GET',url:'/api/v1/campaigns',headers:auth(clientA)})).json<{data:unknown[]}>().data).toHaveLength(1);
    expect((await app.inject({method:'GET',url:`/api/v1/campaigns/${campaignB}`,headers:auth(clientA)})).statusCode).toBe(404);
    expect((await app.inject({method:'PATCH',url:`/api/v1/campaigns/${campaignB}`,headers:auth(clientA),payload:{name:'Stolen'}})).statusCode).toBe(404);
    const updated=await app.inject({method:'PATCH',url:`/api/v1/campaigns/${campaignA}`,headers:auth(clientA),payload:{estimatedBudget:50000000,currency:'idr',plannedStart:'2026-10-01',plannedEnd:'2026-10-31',brief:{description:'Detailed client brief',targetAudience:'Urban professionals',keyMessage:'Try product A'}}});expect(updated.statusCode).toBe(200);expect(updated.json<{estimatedBudget:number}>().estimatedBudget).toBe(50000000);
    expect((await app.inject({method:'PATCH',url:`/api/v1/campaigns/${campaignA}`,headers:auth(clientA),payload:{status:'active',createdBy:clientA.id}})).statusCode).toBe(422);
    expect((await app.inject({method:'POST',url:`/api/v1/campaigns/${campaignA}/submit`,headers:auth(clientA)})).json<{status:string}>().status).toBe('submitted');
    expect((await app.inject({method:'POST',url:`/api/v1/campaigns/${campaignA}/submit`,headers:auth(clientA)})).statusCode).toBe(409);
    expect((await app.inject({method:'POST',url:`/api/v1/admin/campaigns/${campaignA}/start-review`,headers:auth(clientA)})).statusCode).toBe(403);
    expect((await app.inject({method:'GET',url:'/api/v1/admin/campaigns',headers:auth(reviewer)})).statusCode).toBe(200);
  });

  it('enforces the Internal review and Client revision state machine',async()=>{
    expect((await app.inject({method:'POST',url:`/api/v1/admin/campaigns/${campaignA}/start-review`,headers:auth(reviewer)})).json<{status:string}>().status).toBe('internal_review');
    expect((await app.inject({method:'POST',url:`/api/v1/admin/campaigns/${campaignA}/request-revision`,headers:auth(reviewer),payload:{note:'Clarify audience'}})).json<{status:string}>().status).toBe('changes_requested');
    expect((await app.inject({method:'PATCH',url:`/api/v1/campaigns/${campaignA}`,headers:auth(clientA),payload:{brief:{targetAudience:'Clarified audience'}}})).statusCode).toBe(200);
    expect((await app.inject({method:'POST',url:`/api/v1/campaigns/${campaignA}/submit`,headers:auth(clientA)})).json<{status:string}>().status).toBe('submitted');
    expect((await app.inject({method:'POST',url:`/api/v1/admin/campaigns/${campaignA}/start-review`,headers:auth(reviewer)})).statusCode).toBe(201);
    expect((await app.inject({method:'POST',url:`/api/v1/admin/campaigns/${campaignA}/approve`,headers:auth(reviewer)})).json<{status:string}>().status).toBe('planning');
    expect((await app.inject({method:'POST',url:`/api/v1/admin/campaigns/${campaignA}/approve`,headers:auth(reviewer)})).statusCode).toBe(409);
  });

  it('isolates assignments and exposes only the assigned Partner execution DTO',async()=>{
    const a=await app.inject({method:'POST',url:`/api/v1/admin/campaigns/${campaignA}/assignments`,headers:auth(reviewer),payload:{partnerId:partnerIdA,agreedFee:2500000,feeCurrency:'IDR',rateSnapshot:{service:'reel'},internalNotes:'private procurement note'}});expect(a.statusCode).toBe(201);assignmentA=a.json<{id:string}>().id;
    const b=await app.inject({method:'POST',url:`/api/v1/admin/campaigns/${campaignA}/assignments`,headers:auth(reviewer),payload:{partnerId:partnerIdB,agreedFee:1750000,internalNotes:'other private note'}});expect(b.statusCode).toBe(201);assignmentB=b.json<{id:string}>().id;
    const da=await app.inject({method:'POST',url:`/api/v1/admin/campaign-assignments/${assignmentA}/deliverables`,headers:auth(reviewer),payload:{title:'Instagram Reel',platform:'Instagram',quantity:1}});expect(da.statusCode).toBe(201);deliverableA=da.json<{id:string}>().id;
    const db=await app.inject({method:'POST',url:`/api/v1/admin/campaign-assignments/${assignmentB}/deliverables`,headers:auth(reviewer),payload:{title:'TikTok Video',platform:'TikTok',quantity:1}});expect(db.statusCode).toBe(201);deliverableB=db.json<{id:string}>().id;
    expect((await app.inject({method:'GET',url:'/api/v1/me/campaign-assignments',headers:auth(partnerA)})).json<unknown[]>()).toHaveLength(1);
    const detail=await app.inject({method:'GET',url:`/api/v1/campaign-assignments/${assignmentA}`,headers:auth(partnerA)});expect(detail.statusCode).toBe(200);const body=detail.body.toLowerCase();expect(body).not.toContain('estimatedbudget');expect(body).not.toContain('internalnotes');expect(body).not.toContain('ratesnapshot');expect(body).not.toContain(assignmentB.toLowerCase());
    expect((await app.inject({method:'GET',url:`/api/v1/campaign-assignments/${assignmentB}`,headers:auth(partnerA)})).statusCode).toBe(404);
    expect((await app.inject({method:'POST',url:`/api/v1/campaign-assignments/${assignmentB}/accept`,headers:auth(partnerA)})).statusCode).toBe(404);
    expect((await app.inject({method:'POST',url:`/api/v1/deliverables/${deliverableA}/publications`,headers:auth(partnerA),payload:{submissionId:randomUUID(),publicationUrl:'https://social.example/before-approval'}})).statusCode).toBe(409);
    expect((await app.inject({method:'POST',url:`/api/v1/campaign-assignments/${assignmentA}/accept`,headers:auth(partnerA)})).json<{status:string}>().status).toBe('accepted');
    expect((await app.inject({method:'POST',url:`/api/v1/campaign-assignments/${assignmentA}/accept`,headers:auth(partnerA)})).statusCode).toBe(409);
    expect((await app.inject({method:'GET',url:`/api/v1/deliverables/${deliverableB}/submissions`,headers:auth(partnerA)})).statusCode).toBe(404);
  });

  it('preserves content versions and enforces Internal then Client approval',async()=>{
    const first=await app.inject({method:'POST',url:`/api/v1/deliverables/${deliverableA}/submissions`,headers:auth(partnerA),payload:{captionBody:'Version one'}});expect(first.statusCode).toBe(201);submissionV1=first.json<{id:string}>().id;
    expect((await app.inject({method:'POST',url:`/api/v1/content-submissions/${submissionV1}/approve`,headers:auth(clientA),payload:{}})).statusCode).toBe(409);
    expect((await app.inject({method:'POST',url:`/api/v1/admin/content-submissions/${submissionV1}/approve`,headers:auth(partnerA),payload:{}})).statusCode).toBe(403);
    expect((await app.inject({method:'POST',url:`/api/v1/admin/content-submissions/${submissionV1}/request-revision`,headers:auth(reviewer),payload:{note:'Revise opening'}})).statusCode).toBe(201);
    const second=await app.inject({method:'POST',url:`/api/v1/deliverables/${deliverableA}/submissions`,headers:auth(partnerA),payload:{captionBody:'Version two'}});expect(second.statusCode).toBe(201);submissionV2=second.json<{id:string}>().id;
    const versions=(await app.inject({method:'GET',url:`/api/v1/deliverables/${deliverableA}/submissions`,headers:auth(partnerA)})).json<Array<{id:string;version:number;captionBody:string}>>();expect(versions).toHaveLength(2);expect(versions.map(x=>x.version)).toEqual([1,2]);expect(versions[0]).toMatchObject({id:submissionV1,captionBody:'Version one'});
    expect((await app.inject({method:'POST',url:`/api/v1/admin/content-submissions/${submissionV2}/approve`,headers:auth(reviewer),payload:{note:'Internal approved'}})).statusCode).toBe(201);
    expect((await app.inject({method:'POST',url:`/api/v1/content-submissions/${submissionV2}/approve`,headers:auth(partnerA),payload:{}})).statusCode).toBe(409);
    expect((await app.inject({method:'POST',url:`/api/v1/content-submissions/${submissionV2}/approve`,headers:auth(clientB),payload:{}})).statusCode).toBe(409);
    expect((await app.inject({method:'POST',url:`/api/v1/content-submissions/${submissionV2}/approve`,headers:auth(clientA),payload:{note:'Final approval'}})).statusCode).toBe(201);
  });

  it('requires final content approval and Internal publication verification before append-only metrics',async()=>{
    expect((await app.inject({method:'POST',url:`/api/v1/deliverables/${deliverableA}/publications`,headers:auth(partnerA),payload:{submissionId:submissionV1,publicationUrl:'https://social.example/wrong-version'}})).statusCode).toBe(409);
    const published=await app.inject({method:'POST',url:`/api/v1/deliverables/${deliverableA}/publications`,headers:auth(partnerA),payload:{submissionId:submissionV2,publicationUrl:'https://social.example/final'}});expect(published.statusCode).toBe(201);publication=published.json<{id:string}>().id;
    expect((await app.inject({method:'POST',url:`/api/v1/publications/${publication}/metrics`,headers:auth(partnerA),payload:{metricType:'views',metricValue:100,source:'platform'}})).statusCode).toBe(409);
    expect((await app.inject({method:'POST',url:`/api/v1/admin/publications/${publication}/verify`,headers:auth(partnerA),payload:{}})).statusCode).toBe(403);
    expect((await app.inject({method:'POST',url:`/api/v1/admin/publications/${publication}/verify`,headers:auth(reviewer),payload:{note:'URL checked'}})).statusCode).toBe(201);
    expect((await app.inject({method:'POST',url:`/api/v1/publications/${publication}/metrics`,headers:auth(partnerA),payload:{metricType:'views',metricValue:100,source:'platform'}})).statusCode).toBe(201);
    expect((await app.inject({method:'POST',url:`/api/v1/publications/${publication}/metrics`,headers:auth(reviewer),payload:{metricType:'reach',metricValue:80,source:'internal verification'}})).statusCode).toBe(201);
    expect((await app.inject({method:'GET',url:`/api/v1/publications/${publication}/metrics`,headers:auth(clientA)})).json<unknown[]>()).toHaveLength(2);
    expect((await app.inject({method:'GET',url:`/api/v1/publications/${publication}/metrics`,headers:auth(partnerB)})).statusCode).toBe(404);
  });
});
