import { describe, expect, it } from 'vitest';
import { safeMessage } from '@/features/onboarding/onboarding-api';
describe('onboarding error handling', () => {
  it('hides database details for duplicate claims', () => expect(safeMessage(new Error('claim already pending for partner'))).toBe('Permintaan claim sudah menunggu review.'));
  it('hides permission details', () => expect(safeMessage(new Error('permission denied by RLS'))).toBe('Anda tidak memiliki izin untuk tindakan ini.'));
  it('uses neutral fallback', () => expect(safeMessage(new Error('SQLSTATE 23505'))).toBe('Operasi gagal. Periksa data lalu coba lagi.'));
});
