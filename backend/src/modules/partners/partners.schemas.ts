import { z } from 'zod';

const optionalText=(max:number)=>z.string().trim().max(max).nullable().optional();
const optionalHttpUrl=z.string().url().max(500).refine(value=>{const protocol=new URL(value).protocol;return protocol==='https:'||protocol==='http:';},'Only HTTP(S) URLs are accepted.').nullable().optional();
export const partnerUpdateSchema=z.object({displayName:z.string().trim().min(2).max(160).optional(),legalName:optionalText(200),partnerType:optionalText(80),category:optionalText(80),niche:optionalText(80),location:optionalText(160),bio:optionalText(2000)}).strict().refine(v=>Object.values(v).some(x=>x!==undefined));
export const platformCreateSchema=z.object({platform:z.string().trim().min(1).max(50),handle:optionalText(160),profileUrl:optionalHttpUrl,isPrimary:z.boolean().default(false)}).strict();
export const platformUpdateSchema=z.object({platform:z.string().trim().min(1).max(50).optional(),handle:optionalText(160),profileUrl:optionalHttpUrl,isPrimary:z.boolean().optional()}).strict().refine(v=>Object.values(v).some(x=>x!==undefined));
const date=z.string().date();
export const rateCreateSchema=z.object({serviceType:z.string().trim().min(1).max(120),amount:z.coerce.number().finite().min(0).max(999_999_999_999),currency:z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).default('IDR'),effectiveFrom:date.optional()}).strict();
export const rateUpdateSchema=z.object({serviceType:z.string().trim().min(1).max(120).optional(),amount:z.coerce.number().finite().min(0).max(999_999_999_999).optional(),currency:z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).optional(),effectiveFrom:date.optional()}).strict().refine(v=>Object.values(v).some(x=>x!==undefined));
export type PartnerUpdate=z.infer<typeof partnerUpdateSchema>;export type PlatformCreate=z.infer<typeof platformCreateSchema>;export type PlatformUpdate=z.infer<typeof platformUpdateSchema>;export type RateCreate=z.infer<typeof rateCreateSchema>;export type RateUpdate=z.infer<typeof rateUpdateSchema>;
