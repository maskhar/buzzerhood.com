import { z } from 'zod';
import { limitSchema, pageSchema } from '../../common/validation/query.schemas.js';

export const campaignStatuses = ['draft','submitted','internal_review','changes_requested','planning','active','publishing','monitoring','reporting','completed','cancelled','archived'] as const;
export const metricTypes = ['followers','subscribers','members','monthly_visitors','views','reach','impressions','engagement','engagement_rate'] as const;
const nullableText = (max: number) => z.string().trim().max(max).nullable().optional();
const date = z.string().date();
const nullableDate = date.nullable().optional();
const httpUrl = z.string().url().max(1000).refine((value) => ['http:','https:'].includes(new URL(value).protocol), 'Only HTTP(S) URLs are accepted.');

export const campaignListSchema = z.object({ organizationId: z.string().uuid().optional(), status: z.enum(campaignStatuses).optional(), page: pageSchema, limit: limitSchema }).strict();
export const createCampaignSchema = z.object({ organizationId: z.string().uuid(), name: z.string().trim().min(2).max(180), objectiveSummary: nullableText(2000) }).strict();
export const updateCampaignSchema = z.object({
  name: z.string().trim().min(2).max(180).optional(), objectiveSummary: nullableText(2000), plannedStart: nullableDate, plannedEnd: nullableDate,
  estimatedBudget: z.coerce.number().finite().min(0).max(999_999_999_999).nullable().optional(), currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).optional(),
  brief: z.object({ objective: nullableText(4000), description: nullableText(8000), targetAudience: nullableText(4000), keyMessage: nullableText(4000), callToAction: nullableText(2000), contentDirection: nullableText(8000), prohibitedContent: nullableText(4000), notes: nullableText(4000), kpiExpectation: nullableText(4000), context: z.record(z.string(), z.unknown()).nullable().optional() }).strict().optional()
}).strict().refine((value) => Object.values(value).some((item) => item !== undefined));
export const noteSchema = z.object({ note: z.string().trim().max(2000).optional() }).strict();
export const transitionSchema = z.object({ to: z.enum(campaignStatuses), reason: z.string().trim().max(2000).optional() }).strict();
export const assignmentCreateSchema = z.object({ partnerId: z.string().uuid(), agreedFee: z.coerce.number().finite().min(0).max(999_999_999_999).nullable().optional(), feeCurrency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).default('IDR'), rateSnapshot: z.record(z.string(), z.unknown()).nullable().optional(), internalNotes: nullableText(4000) }).strict();
export const deliverableCreateSchema = z.object({ title: z.string().trim().min(2).max(180), description: nullableText(4000), platform: nullableText(80), dueDate: date.nullable().optional(), quantity: z.coerce.number().int().min(1).max(100).default(1) }).strict();
export const submissionCreateSchema = z.object({ captionBody: z.string().trim().min(1).max(20_000), conceptNotes: nullableText(8000), assetReference: nullableText(1000), contentUrl: httpUrl.nullable().optional() }).strict();
export const publicationCreateSchema = z.object({ submissionId: z.string().uuid(), publicationUrl: httpUrl, platformAccountId: z.string().uuid().nullable().optional() }).strict();
export const metricCreateSchema = z.object({ metricType: z.enum(metricTypes), metricValue: z.coerce.number().finite().min(0).max(999_999_999_999_999), source: z.string().trim().min(1).max(160), periodStart: date.nullable().optional(), periodEnd: date.nullable().optional(), note: nullableText(2000) }).strict().refine((value) => !value.periodStart || !value.periodEnd || value.periodEnd >= value.periodStart, 'Invalid metric period.');

export type CampaignList = z.infer<typeof campaignListSchema>;
export type CreateCampaign = z.infer<typeof createCampaignSchema>;
export type UpdateCampaign = z.infer<typeof updateCampaignSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type TransitionInput = z.infer<typeof transitionSchema>;
export type AssignmentCreate = z.infer<typeof assignmentCreateSchema>;
export type DeliverableCreate = z.infer<typeof deliverableCreateSchema>;
export type SubmissionCreate = z.infer<typeof submissionCreateSchema>;
export type PublicationCreate = z.infer<typeof publicationCreateSchema>;
export type MetricCreate = z.infer<typeof metricCreateSchema>;
