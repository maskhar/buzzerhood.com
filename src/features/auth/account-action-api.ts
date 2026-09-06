import { apiRequest } from '@/lib/api/client';

export function resetPassword(token: string, password: string) {
  return apiRequest<{ success: boolean }>('/auth/reset-password', { method: 'POST', body: { token, password } });
}

export function activateAccount(token: string, password: string) {
  return apiRequest<{ success: boolean }>('/auth/activate-partner', { method: 'POST', body: { token, password } });
}
