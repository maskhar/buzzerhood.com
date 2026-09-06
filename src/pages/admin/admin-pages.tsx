import { useQuery,useQueryClient } from '@tanstack/react-query';
import { approvePartnerClaim,rejectPartnerClaim,reviewPartnerApplication,safeMessage,listAdminPartners,listPendingPartnerApplications,listPendingPartnerClaims } from '@/features/onboarding/onboarding-api';
import { useState } from 'react';

export function AdminPartnersPage(){
 const partners=useQuery({queryKey:['admin-partners'],queryFn:listAdminPartners});
 const applications=useQuery({queryKey:['admin-partner-applications','pending'],queryFn:listPendingPartnerApplications});
 const claims=useQuery({queryKey:['admin-claims','pending'],queryFn:listPendingPartnerClaims});
 const qc=useQueryClient(); const [message,setMessage]=useState('');
 async function review(id:string,decision:'approved'|'rejected'){try{await reviewPartnerApplication(id,decision,'Reviewed in admin network UI');await qc.invalidateQueries({queryKey:['admin-partner-applications']});await qc.invalidateQueries({queryKey:['admin-partners']});setMessage('Review tersimpan.')}catch(error){setMessage(safeMessage(error))}}
 async function reviewClaim(id:string,decision:'approved'|'rejected'){try{if(decision==='approved')await approvePartnerClaim(id,'Approved in admin network UI');else await rejectPartnerClaim(id,'Rejected in admin network UI');await qc.invalidateQueries({queryKey:['admin-claims']});await qc.invalidateQueries({queryKey:['admin-partners']});setMessage('Review claim tersimpan.')}catch(error){setMessage(safeMessage(error))}}
 return <section><p className="eyebrow">ADMIN NETWORK</p><h1>Partner network review</h1><p className="muted">Akses dilindungi Backend API dan permission partners.manage.</p><p>{message}</p><h2>Pending applications</h2><div className="ops-list">{applications.data?.map(p=><article key={p.id}><strong>{p.displayName}</strong><span>{p.partnerType} · {p.niche} · {p.applicantDisplayName??'Applicant'}</span><button onClick={()=>review(p.id,'approved')}>Approve</button><button onClick={()=>review(p.id,'rejected')}>Reject</button></article>)}</div><h2>Claims</h2><div className="ops-list">{claims.data?.map(c=><article key={c.id}><strong>{c.partnerDisplayName}</strong><span>{c.claimantDisplayName??'Claimant'} · {c.evidence}</span><button onClick={()=>reviewClaim(c.id,'approved')}>Approve claim</button><button onClick={()=>reviewClaim(c.id,'rejected')}>Reject claim</button></article>)}</div><h2>All partners</h2><div className="ops-list">{partners.data?.map(p=><article key={p.id}><strong>{p.displayName}</strong><span>{p.status} · {p.partnerType??p.kind}</span></article>)}</div></section>}

