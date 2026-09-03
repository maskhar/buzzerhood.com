import { ApiError } from './api-error.js';

export function postgresMessage(error: unknown): string {
  return typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : '';
}
export function postgresCode(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined;
}
export function conflictFromDatabase(error: unknown, code: string, message: string): never {
  if (postgresCode(error) === '23505' || /already|pending|conflict|unavailable/i.test(postgresMessage(error))) {
    throw new ApiError(409, code, message);
  }
  throw error;
}
