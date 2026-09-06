import { apiRequest } from '@/lib/api/client';
export type EmailDiagnostics = { configured: boolean; verified: boolean; reason: string | null };
export function getEmailDiagnostics() { return apiRequest<EmailDiagnostics>('/admin/email/diagnostics'); }
export function sendEmailTest(recipient: string) { return apiRequest<{ delivered: boolean }>('/admin/email/test', { method: 'POST', body: { recipient } }); }
