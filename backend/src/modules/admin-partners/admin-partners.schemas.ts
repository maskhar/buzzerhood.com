import{z}from'zod';import{limitSchema,pageSchema}from'../../common/validation/query.schemas.js';
export const adminPartnerQuerySchema=z.object({status:z.enum(['pending','approved','rejected','unclaimed']).optional(),page:pageSchema,limit:limitSchema}).strict();
export const adminClaimQuerySchema=z.object({status:z.enum(['pending','approved','rejected','cancelled']).optional(),page:pageSchema,limit:limitSchema}).strict();
export const reviewSchema=z.object({note:z.string().trim().max(2000).optional()}).strict();
export type AdminPartnerQuery=z.infer<typeof adminPartnerQuerySchema>;export type AdminClaimQuery=z.infer<typeof adminClaimQuerySchema>;export type ReviewInput=z.infer<typeof reviewSchema>;
