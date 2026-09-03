import { ApiError } from '../../common/errors/api-error.js';
import { postgresCode, postgresMessage } from '../../common/errors/postgres-error.js';

export function campaignDatabaseError(error: unknown, fallbackCode = 'CAMPAIGN_OPERATION_FAILED'): never {
  if (error instanceof ApiError) throw error;
  const message = postgresMessage(error).toLowerCase();
  if (postgresCode(error) === '23505') throw new ApiError(409, 'CAMPAIGN_CONFLICT', 'Data Campaign tersebut sudah ada.');
  if (message.includes('invalid campaign transition')) throw new ApiError(409, 'CAMPAIGN_INVALID_TRANSITION', 'Transisi status Campaign tidak valid.');
  if (message.includes('assignment not found')) throw new ApiError(404, 'ASSIGNMENT_NOT_FOUND', 'Assignment tidak ditemukan.');
  if (message.includes('invalid assignment response')) throw new ApiError(409, 'ASSIGNMENT_INVALID_STATE', 'Assignment tidak dapat direspons pada status ini.');
  if (message.includes('deliverable not') || message.includes('invalid deliverable')) throw new ApiError(409, 'DELIVERABLE_INVALID_STATE', 'Deliverable tidak tersedia untuk operasi ini.');
  if (message.includes('content not approved')) throw new ApiError(409, 'CONTENT_NOT_APPROVED', 'Content belum mendapat persetujuan final.');
  if (message.includes('content review not allowed') || message.includes('submission not reviewable')) throw new ApiError(409, 'CONTENT_REVIEW_NOT_ALLOWED', 'Content belum berada pada tahap review ini.');
  if (message.includes('publication not') || message.includes('invalid platform account')) throw new ApiError(409, 'PUBLICATION_NOT_ALLOWED', 'Publication belum dapat diproses.');
  if (message.includes('metric recording not allowed')) throw new ApiError(409, 'METRIC_NOT_ALLOWED', 'Metric belum dapat dicatat.');
  if (message.includes('campaign not found')) throw new ApiError(404, 'CAMPAIGN_NOT_FOUND', 'Campaign tidak ditemukan.');
  if (message.includes('not assignable')) throw new ApiError(409, 'ASSIGNMENT_INVALID_STATE', 'Campaign atau Partner belum dapat di-assign.');
  if (message.includes('permission denied')) throw new ApiError(404, fallbackCode, 'Resource tidak ditemukan.');
  throw error;
}
