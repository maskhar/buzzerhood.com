import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@/lib/api/errors';
import { apiQueryKeys } from '@/lib/api/query-keys';
import {
  getPublicPartnerApplication,
  invitePublicPartnerApplication,
  listPublicPartnerApplications,
  reviewPublicPartnerApplication,
  setPublicPartnerApplicationArchived,
  type PublicPartnerApplicationStatus,
  type PublicPartnerInvitationStatus,
} from '@/features/admin/public-partner-applications-api';

const statuses: PublicPartnerApplicationStatus[] = ['pending', 'approved', 'rejected'];
const statusLabels: Record<PublicPartnerApplicationStatus, string> = { pending: 'Menunggu review', approved: 'Disetujui', rejected: 'Ditolak' };
const invitationStatusLabels: Record<PublicPartnerInvitationStatus, string> = { not_created: 'Belum dibuat', invited: 'Undangan terkirim', active: 'Akun aktif', attention: 'Perlu pemeriksaan' };

function InvitationStatus({ status }: { status: PublicPartnerInvitationStatus }) {
  return <span className={`partner-invitation-status partner-invitation-status-${status}`}>{invitationStatusLabels[status]}</span>;
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function errorMessage(error: unknown) {
  if (error instanceof ApiClientError) return error.message;
  return 'Operasi gagal. Coba lagi.';
}

export function PublicPartnerApplicationsPage() {
  const [status, setStatus] = useState<PublicPartnerApplicationStatus>('pending');
  const [archived, setArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const applications = useQuery({ queryKey: [...apiQueryKeys.publicPartnerApplications(status), archived], queryFn: () => listPublicPartnerApplications(status, archived) });
  const selected = useQuery({ queryKey: apiQueryKeys.publicPartnerApplication(selectedId ?? 'none'), queryFn: () => getPublicPartnerApplication(selectedId ?? ''), enabled: Boolean(selectedId) });

  async function review(decision: 'approved' | 'rejected') {
    if (!selectedId) return;
    setSubmitting(true);
    setMessage('');
    try {
      const result = await reviewPublicPartnerApplication(selectedId, decision, note);
      setMessage(`Pendaftaran ${result.fullName} ${decision === 'approved' ? 'disetujui' : 'ditolak'}.`);
      setNote('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.publicPartnerApplications('pending') }),
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.publicPartnerApplications('approved') }),
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.publicPartnerApplications('rejected') }),
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.publicPartnerApplication(selectedId) }),
      ]);
      setStatus(decision);
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }
  async function archive(nextArchived: boolean) { if (!selectedId) return; setSubmitting(true); try { await setPublicPartnerApplicationArchived(selectedId, nextArchived); setMessage(nextArchived ? 'Pendaftaran diarsipkan.' : 'Pendaftaran dipulihkan.'); await queryClient.invalidateQueries({ queryKey: ['api', 'admin', 'public-partner-applications'] }); } catch (error) { setMessage(errorMessage(error)); } finally { setSubmitting(false); } }
  async function resendInvitation() { if (!selectedId || !selected.data || selected.data.status !== 'approved' || selected.data.archivedAt) return; setSubmitting(true); setMessage(''); try { const result = await invitePublicPartnerApplication(selectedId); setMessage(result.status === 'active' ? 'Akun Partner sudah aktif.' : result.status === 'reactivated' ? 'Akses Partner dipulihkan.' : 'Undangan Partner dikirim ulang.'); await queryClient.invalidateQueries({ queryKey: apiQueryKeys.publicPartnerApplication(selectedId) }); } catch (error) { setMessage(errorMessage(error)); } finally { setSubmitting(false); } }

  return <section className="admin-review-page">
    <p className="eyebrow">PROGRAM PARTNER</p>
    <h1>Review pendaftaran Partner</h1>
    <p className="muted">Approval membuat akun Partner berstatus invited dan mengirim email untuk membuat password. Archive dapat dipulihkan.</p>
    <div className="admin-review-tabs" role="tablist" aria-label="Status pendaftaran">
      {statuses.map((item) => <button key={item} type="button" className={item === status ? 'active' : ''} onClick={() => { setStatus(item); setSelectedId(null); setMessage(''); }}>{statusLabels[item]}</button>)}
    </div>
    <label><input type="checkbox" checked={archived} onChange={(event) => { setArchived(event.target.checked); setSelectedId(null); }} /> Tampilkan arsip</label>
    {message ? <p className="form-message" role="status">{message}</p> : null}
    <div className="admin-review-layout">
      <div className="db-table-wrap">
        {applications.isLoading ? <p className="db-empty">Memuat pendaftaran…</p> : null}
        {applications.isError ? <p className="db-empty">{errorMessage(applications.error)}</p> : null}
        {applications.data && applications.data.data.length === 0 ? <p className="db-empty">Belum ada pendaftaran dengan status ini.</p> : null}
        {applications.data?.data.length ? <table className="db-table"><thead><tr><th>Partner</th><th>Kategori</th><th>Lokasi</th><th>Akses</th><th>Dikirim</th><th /></tr></thead><tbody>{applications.data.data.map((application) => <tr key={application.id}><td><strong>{application.fullName}</strong><span>{application.email}</span></td><td>{application.category}</td><td>{application.city}</td><td><InvitationStatus status={application.invitationStatus} /></td><td>{formatDate(application.createdAt)}</td><td><button type="button" className="btn-ghost compact-button" onClick={() => { setSelectedId(application.id); setNote(application.reviewNote ?? ''); }}>Detail</button></td></tr>)}</tbody></table> : null}
      </div>
      <aside className="review-panel">
        {!selectedId ? <p className="muted">Pilih pendaftaran untuk melihat detail dan melakukan review.</p> : null}
        {selected.isLoading ? <p className="muted">Memuat detail…</p> : null}
        {selected.isError ? <p className="form-message">{errorMessage(selected.error)}</p> : null}
        {selected.data ? <>
          <p className="eyebrow">{statusLabels[selected.data.status]}</p>
          <h2>{selected.data.fullName}</h2>
          <div className="review-result"><strong>Akses Partner</strong><span><InvitationStatus status={selected.data.invitationStatus} /></span></div>
          <dl className="review-details"><div><dt>Email</dt><dd>{selected.data.email}</dd></div><div><dt>WhatsApp</dt><dd>{selected.data.whatsapp}</dd></div><div><dt>Kota</dt><dd>{selected.data.city}</dd></div><div><dt>Kategori</dt><dd>{selected.data.category}</dd></div><div><dt>Pesan</dt><dd>{selected.data.message || '-'}</dd></div><div><dt>Detail</dt><dd>{Object.entries(selected.data.details).map(([key, value]) => <span key={key}>{key}: {Array.isArray(value) ? value.join(', ') : value}</span>)}</dd></div></dl>
          {selected.data.status === 'pending' ? <div className="review-action"><label htmlFor="review-note">Catatan review</label><textarea id="review-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} placeholder="Opsional untuk approval; jelaskan alasan jika ditolak." /><div><button type="button" className="btn-ghost" disabled={submitting} onClick={() => void review('rejected')}>Tolak</button><button type="button" className="btn-solid" disabled={submitting} onClick={() => void review('approved')}>Setujui & kirim undangan</button></div></div> : <div className="review-result"><strong>Keputusan: {statusLabels[selected.data.status]}</strong><span>{selected.data.reviewNote || 'Tanpa catatan review.'}</span><span>{formatDate(selected.data.reviewedAt)}</span></div>}
          {selected.data.status === 'approved' && selected.data.invitationStatus === 'invited' && !selected.data.archivedAt ? <button type="button" className="btn-solid" disabled={submitting} onClick={() => void resendInvitation()}>Kirim ulang undangan</button> : null}
          {selected.data.status === 'approved' && selected.data.invitationStatus === 'active' ? <p className="muted">Akun sudah aktif. Kirim ulang undangan tidak diperlukan.</p> : null}
          {selected.data.status === 'approved' && selected.data.invitationStatus === 'attention' ? <p className="form-message">Status akun tidak konsisten. Periksa manual sebelum mengirim undangan.</p> : null}
          <button type="button" className="btn-ghost" disabled={submitting} onClick={() => void archive(!selected.data.archivedAt)}>{selected.data.archivedAt ? 'Pulihkan dari arsip' : 'Arsipkan pendaftaran'}</button>
        </> : null}
      </aside>
    </div>
  </section>;
}
