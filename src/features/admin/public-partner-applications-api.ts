import { apiRequest } from '@/lib/api/client';

export type PublicPartnerApplicationStatus = 'pending' | 'approved' | 'rejected';

export type PublicPartnerApplication = {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string;
  city: string;
  category: string;
  message: string | null;
  details: Record<string, string | string[]>;
  status: PublicPartnerApplicationStatus;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type PageMeta = { page: number; limit: number; total: number; hasNext: boolean };

export async function listPublicPartnerApplications(status: PublicPartnerApplicationStatus) {
  return apiRequest<{ data: PublicPartnerApplication[]; meta: PageMeta }>(`/admin/public-partner-applications?status=${status}&page=1&limit=100`);
}

export async function getPublicPartnerApplication(applicationId: string) {
  return apiRequest<PublicPartnerApplication>(`/admin/public-partner-applications/${applicationId}`);
}

export async function reviewPublicPartnerApplication(applicationId: string, decision: Exclude<PublicPartnerApplicationStatus, 'pending'>, note: string) {
  const action = decision === 'approved' ? 'approve' : 'reject';
  return apiRequest<PublicPartnerApplication>(`/admin/public-partner-applications/${applicationId}/${action}`, {
    method: 'POST',
    body: note.trim() ? { note: note.trim() } : {},
  });
}
