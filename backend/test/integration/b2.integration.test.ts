import{generateKeyPairSync,randomUUID}from'node:crypto';import cookie from'@fastify/cookie';import{NestFactory}from'@nestjs/core';import{FastifyAdapter,type NestFastifyApplication}from'@nestjs/platform-fastify';import{Pool}from'pg';import{afterAll,beforeAll,describe,expect,it}from'vitest';import{AppModule}from'../../src/app.module.js';import type{AppConfiguration}from'../../src/common/config/configuration.js';import{ApiExceptionFilter}from'../../src/common/errors/api-exception.filter.js';
const databaseUrl=process.env.TEST_DATABASE_URL,adminUrl=process.env.TEST_ADMIN_DATABASE_URL;if(!databaseUrl||!adminUrl)throw new Error('B2 test database URLs are required.');
function config():AppConfiguration{const p=generateKeyPairSync('ed25519');return{environment:'test',host:'127.0.0.1',port:3100,database:{url:databaseUrl!,poolMin:0,poolMax:1,connectionTimeoutMs:5000,queryTimeoutMs:10000},jwt:{issuer:'https://auth.test.buzzerhood.invalid',audience:'buzzerhood-test',accessTtlSeconds:600,keyId:'b2-test',privateKeyPem:p.privateKey.export({format:'pem',type:'pkcs8'}).toString(),publicKeyPem:p.publicKey.export({format:'pem',type:'spki'}).toString()},refresh:{ttlSeconds:3600,cookieName:'buzzerhood_refresh',csrfCookieName:'buzzerhood_csrf',secure:false,sameSite:'lax'},corsOrigins:['https://test.buzzerhood.invalid'],registrationMode:'open',rateLimit:{ttlMs:60000,max:1000},swaggerEnabled:false,logLevel:'silent'};}
type Identity={id:string;token:string};
describe('B2 workspace, organization and Partner APIs',()=>{
 let app:NestFastifyApplication;let admin:Pool;const password='correct horse battery staple';let a:Identity,b:Identity,reviewer:Identity,claimantA:Identity,claimantB:Identity;let orgA:string,orgB:string,partnerA:string,claimable:string,claimableName:string;
 const auth=(x:Identity)=>({authorization:`Bearer ${x.token}`});
 async function register(label:string):Promise<Identity>{const email=`${label}-${randomUUID()}@example.com`;const r=await app.inject({method:'POST',url:'/api/v1/auth/register',payload:{email,password,displayName:label}});expect(r.statusCode).toBe(201);const token=r.json<{accessToken:string}>().accessToken;const me=await app.inject({method:'GET',url:'/api/v1/auth/me',headers:{authorization:`Bearer ${token}`}});return{id:me.json<{id:string}>().id,token};}
 beforeAll(async()=>{app=await NestFactory.create<NestFastifyApplication>(AppModule.register(config()),new FastifyAdapter({logger:false}));await app.register(cookie);app.useGlobalFilters(new ApiExceptionFilter());app.setGlobalPrefix('api/v1',{exclude:['health','ready']});await app.init();await app.getHttpAdapter().getInstance().ready();admin=new Pool({connectionString:adminUrl});a=await register('user-a');b=await register('user-b');reviewer=await register('reviewer');claimantA=await register('claimant-a');claimantB=await register('claimant-b');await admin.query("insert into buzzerhood.user_roles(profile_id,role_id) select $1,id from buzzerhood.roles where key='internal_team'",[reviewer.id]);const found=await admin.query<{id:string;display_name:string}>("select id,display_name from buzzerhood.partners where verification_status='unclaimed' order by id limit 1");claimable=found.rows[0]!.id;claimableName=found.rows[0]!.display_name;});
 afterAll(async()=>{await admin.end();await app.close();});
 it('resolves zero/client/admin workspaces and enforces organization isolation',async()=>{
  expect((await app.inject({method:'GET',url:'/api/v1/me/workspaces',headers:auth(a)})).json()).toEqual({client:[],partner:[],admin:false});
  const ca=await app.inject({method:'POST',url:'/api/v1/organizations',headers:auth(a),payload:{name:'Client A',slug:`client-a-${randomUUID().slice(0,8)}`}});expect(ca.statusCode).toBe(201);orgA=ca.json<{id:string}>().id;
  const cb=await app.inject({method:'POST',url:'/api/v1/organizations',headers:auth(b),payload:{name:'Client B',slug:`client-b-${randomUUID().slice(0,8)}`}});expect(cb.statusCode).toBe(201);orgB=cb.json<{id:string}>().id;
  const wa=(await app.inject({method:'GET',url:'/api/v1/me/workspaces',headers:auth(a)})).json<{client:unknown[]}>();expect(wa.client).toHaveLength(1);
  expect((await app.inject({method:'GET',url:'/api/v1/organizations',headers:auth(a)})).json<unknown[]>()).toHaveLength(1);
  expect((await app.inject({method:'GET',url:`/api/v1/organizations/${orgA}`,headers:auth(a)})).statusCode).toBe(200);
  expect((await app.inject({method:'PATCH',url:`/api/v1/organizations/${orgA}`,headers:auth(a),payload:{name:'Client A Updated'}})).statusCode).toBe(200);
  expect((await app.inject({method:'GET',url:`/api/v1/organizations/${orgA}/members`,headers:auth(a)})).json<unknown[]>()).toHaveLength(1);
  expect((await app.inject({method:'GET',url:`/api/v1/organizations/${orgB}`,headers:auth(a)})).statusCode).toBe(404);
  expect((await app.inject({method:'PATCH',url:`/api/v1/organizations/${orgB}`,headers:auth(a),payload:{name:'stolen'}})).statusCode).toBe(404);
  expect((await app.inject({method:'PATCH',url:`/api/v1/organizations/${orgA}`,headers:auth(a),payload:{ownerId:a.id,status:'active'}})).statusCode).toBe(422);
  expect((await app.inject({method:'GET',url:'/api/v1/me/workspaces',headers:auth(reviewer)})).json<{admin:boolean}>().admin).toBe(true);
 });
 it('keeps applications pending until permission-checked atomic review',async()=>{
  const created=await app.inject({method:'POST',url:'/api/v1/partner-applications',headers:auth(a),payload:{kind:'individual',displayName:'Creator A',partnerType:'Influencer',niche:'Lifestyle'}});expect(created.statusCode).toBe(201);partnerA=created.json<{id:string;status:string}>().id;expect(created.json<{status:string}>().status).toBe('pending');
  expect((await app.inject({method:'GET',url:'/api/v1/me/workspaces',headers:auth(a)})).json<{partner:unknown[]}>().partner).toHaveLength(0);
  expect((await app.inject({method:'GET',url:`/api/v1/partners/${partnerA}`,headers:auth(a)})).statusCode).toBe(404);
  expect((await app.inject({method:'POST',url:`/api/v1/admin/partner-applications/${partnerA}/approve`,headers:auth(a),payload:{}})).statusCode).toBe(403);
  expect((await app.inject({method:'GET',url:'/api/v1/admin/partner-applications',headers:auth(a)})).statusCode).toBe(403);
  expect((await app.inject({method:'POST',url:`/api/v1/admin/partner-applications/${partnerA}/approve`,headers:auth(reviewer),payload:{note:'verified'}})).statusCode).toBe(201);
  expect((await app.inject({method:'GET',url:'/api/v1/me/workspaces',headers:auth(a)})).json<{partner:unknown[]}>().partner).toHaveLength(1);
  const rejected=await app.inject({method:'POST',url:'/api/v1/partner-applications',headers:auth(b),payload:{kind:'organization',displayName:'Rejected Media'}});expect(rejected.statusCode).toBe(201);expect((await app.inject({method:'POST',url:`/api/v1/admin/partner-applications/${rejected.json<{id:string}>().id}/reject`,headers:auth(reviewer),payload:{note:'incomplete'}})).statusCode).toBe(201);
 });
 it('protects private Partner profile, platform, metric and rate resources',async()=>{
  expect((await app.inject({method:'GET',url:`/api/v1/partners/${partnerA}`,headers:auth(a)})).statusCode).toBe(200);
  expect((await app.inject({method:'PATCH',url:`/api/v1/partners/${partnerA}`,headers:auth(a),payload:{bio:'Updated public biography'}})).statusCode).toBe(200);
  expect((await app.inject({method:'PATCH',url:`/api/v1/partners/${partnerA}`,headers:auth(b),payload:{bio:'IDOR'}})).statusCode).toBe(404);
  expect((await app.inject({method:'PATCH',url:`/api/v1/partners/${partnerA}`,headers:auth(a),payload:{verificationStatus:'approved',ownerId:a.id,internalScore:100}})).statusCode).toBe(422);
  const p1=await app.inject({method:'POST',url:`/api/v1/partners/${partnerA}/platforms`,headers:auth(a),payload:{platform:'Instagram',handle:'@creator-a',profileUrl:'https://instagram.com/creator-a',isPrimary:true}});expect(p1.statusCode).toBe(201);const p1id=p1.json<{id:string}>().id;
  expect((await app.inject({method:'POST',url:`/api/v1/partners/${partnerA}/platforms`,headers:auth(a),payload:{platform:'Instagram',handle:'@creator-a',isPrimary:false}})).statusCode).toBe(409);
  const p2=await app.inject({method:'POST',url:`/api/v1/partners/${partnerA}/platforms`,headers:auth(a),payload:{platform:'TikTok',handle:'@creator-a-video',isPrimary:true}});expect(p2.statusCode).toBe(201);
  const platforms=(await app.inject({method:'GET',url:`/api/v1/partners/${partnerA}/platforms`,headers:auth(a)})).json<Array<{id:string;isPrimary:boolean}>>();expect(platforms.filter(x=>x.isPrimary)).toHaveLength(1);
  expect((await app.inject({method:'PATCH',url:`/api/v1/partners/${partnerA}/platforms/${p1id}`,headers:auth(a),payload:{handle:'@creator-a-new'}})).statusCode).toBe(200);
  expect((await app.inject({method:'DELETE',url:`/api/v1/partners/${partnerA}/platforms/${p2.json<{id:string}>().id}`,headers:auth(a)})).statusCode).toBe(200);
  expect((await app.inject({method:'POST',url:`/api/v1/partners/${partnerA}/platforms`,headers:auth(b),payload:{platform:'YouTube',handle:'x'}})).statusCode).toBe(404);
  expect((await app.inject({method:'GET',url:`/api/v1/partners/${partnerA}/metrics`,headers:auth(a)})).statusCode).toBe(200);
  const rate=await app.inject({method:'POST',url:`/api/v1/partners/${partnerA}/rates`,headers:auth(a),payload:{serviceType:'Instagram Post',amount:1500000,currency:'IDR'}});expect(rate.statusCode).toBe(201);const rateId=rate.json<{id:string}>().id;
  expect((await app.inject({method:'GET',url:`/api/v1/partners/${partnerA}/rates`,headers:auth(a)})).statusCode).toBe(200);
  expect((await app.inject({method:'GET',url:`/api/v1/partners/${partnerA}/rates`,headers:auth(b)})).statusCode).toBe(404);
  expect((await app.inject({method:'GET',url:`/api/v1/partners/${partnerA}/rates`})).statusCode).toBe(401);
  expect((await app.inject({method:'PATCH',url:`/api/v1/partners/${partnerA}/rates/${rateId}`,headers:auth(a),payload:{amount:1750000}})).statusCode).toBe(200);
  expect((await app.inject({method:'DELETE',url:`/api/v1/partners/${partnerA}/rates/${rateId}`,headers:auth(a)})).json<{isActive:boolean}>().isActive).toBe(false);
 });
 it('exposes only restricted public network data with validated filters and pagination',async()=>{
  const n=await app.inject({method:'GET',url:'/api/v1/network?page=1&limit=5'});expect(n.statusCode).toBe(200);const body=n.json<{data:Array<Record<string,unknown>>;meta:{limit:number;total:number}}>();expect(body.data).toHaveLength(5);expect(body.meta.limit).toBe(5);expect(body.meta.total).toBeGreaterThanOrEqual(124);
  const serialized=JSON.stringify(body).toLowerCase();for(const forbidden of ['rate','evidence','membership','source_data','user_id','password','email','phone'])expect(serialized).not.toContain(forbidden);
  const first=body.data[0]!;expect((await app.inject({method:'GET',url:`/api/v1/network?platform=${encodeURIComponent(String(first.platform))}&tier=${encodeURIComponent(String(first.tier))}&limit=2`})).statusCode).toBe(200);
  expect((await app.inject({method:'GET',url:'/api/v1/network?limit=1000'})).statusCode).toBe(422);
 });
 it('keeps claims pending, rejects conflicts, and permits only reviewer approval',async()=>{
  const publicMatch=await app.inject({method:'GET',url:`/api/v1/network?search=${encodeURIComponent(claimableName)}&limit=10`});expect(publicMatch.body).toContain(claimable);
  const claim=await app.inject({method:'POST',url:'/api/v1/partner-claims',headers:auth(claimantA),payload:{partnerId:claimable,evidence:'Verified ownership evidence for disposable testing.'}});expect(claim.statusCode).toBe(201);const claimId=claim.json<{id:string}>().id;
  expect((await app.inject({method:'GET',url:'/api/v1/me/workspaces',headers:auth(claimantA)})).json<{partner:unknown[]}>().partner).toHaveLength(0);
  expect((await app.inject({method:'GET',url:`/api/v1/partners/${claimable}/rates`,headers:auth(claimantA)})).statusCode).toBe(404);
  expect((await app.inject({method:'POST',url:'/api/v1/partner-claims',headers:auth(claimantB),payload:{partnerId:claimable,evidence:'Conflicting ownership evidence for disposable testing.'}})).statusCode).toBe(409);
  expect((await app.inject({method:'POST',url:`/api/v1/admin/partner-claims/${claimId}/approve`,headers:auth(claimantA),payload:{}})).statusCode).toBe(403);
  expect((await app.inject({method:'POST',url:`/api/v1/admin/partner-claims/${claimId}/approve`,headers:auth(reviewer),payload:{note:'ownership verified'}})).statusCode).toBe(201);
  expect((await app.inject({method:'GET',url:'/api/v1/me/workspaces',headers:auth(claimantA)})).json<{partner:unknown[]}>().partner).toHaveLength(1);
  expect((await app.inject({method:'GET',url:'/api/v1/admin/partners?limit=10',headers:auth(reviewer)})).statusCode).toBe(200);
  expect((await app.inject({method:'GET',url:'/api/v1/admin/partner-claims',headers:auth(reviewer)})).statusCode).toBe(200);
 });
 it('retains runtime least privilege after scoped Campaign grants',async()=>{const q=await admin.query<{bypass:boolean;super:boolean;campaign:boolean;roles:boolean}>("select r.rolbypassrls bypass,r.rolsuper super,has_table_privilege('buzzerhood_app','buzzerhood.campaigns','select') campaign,has_table_privilege('buzzerhood_app','buzzerhood.user_roles','insert') roles from pg_roles r where r.rolname='buzzerhood_app'");expect(q.rows[0]).toEqual({bypass:false,super:false,campaign:true,roles:false});});
});
