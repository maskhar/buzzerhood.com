import { Inject, Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';
import { APP_CONFIGURATION } from '../config/configuration.module.js';
import type { AppConfiguration } from '../config/configuration.js';

export type PublicPartnerApplicationEmail = {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string;
  city: string;
  category: string;
  message: string | null;
};

export type PublicPartnerApplicationDecisionEmail = PublicPartnerApplicationEmail & {
  status: 'approved' | 'rejected';
  reviewNote: string | null;
};

export type PublicCampaignRequestEmail = {
  id: string;
  token: string;
  contactName: string;
  email: string;
  whatsapp: string;
  organizationName: string;
  needType: string;
  platformTarget: string;
  brief: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter | null;

  constructor(@Inject(APP_CONFIGURATION) private readonly config: AppConfiguration) {
    this.transporter = config.email.enabled && config.email.host && config.email.user && config.email.password
      ? nodemailer.createTransport({ host: config.email.host, port: config.email.port, secure: config.email.secure, auth: { user: config.email.user, pass: config.email.password } })
      : null;
  }

  async sendPartnerApplicationReceived(application: PublicPartnerApplicationEmail): Promise<void> {
    await Promise.allSettled([this.sendInternalNotification(application), this.sendApplicantConfirmation(application)]);
  }

  async sendCampaignRequestReceived(request: PublicCampaignRequestEmail): Promise<void> {
    await Promise.allSettled([
      this.send({ to: request.email, subject: 'Brief campaign Buzzerhood diterima', text: `Halo ${request.contactName},\n\nBrief campaign dari ${request.organizationName} sudah kami terima. Tim Buzzerhood akan meninjau dan menghubungi Anda melalui email atau WhatsApp.\n\nCek status: ${this.config.email.publicWebUrl}/campaign-request/status?token=${encodeURIComponent(request.token)}\n\nTim Buzzerhood` }),
      this.sendInternalCampaignRequest(request)
    ]);
  }

  async diagnostics() {
    if (!this.transporter) return { configured: false, verified: false, reason: 'SMTP belum dikonfigurasi.' };
    try { await this.transporter.verify(); return { configured: true, verified: true, reason: null }; }
    catch { return { configured: true, verified: false, reason: 'Koneksi SMTP atau sertifikat TLS tidak valid.' }; }
  }

  async sendTestEmail(recipient: string): Promise<{ delivered: boolean }> {
    if (!this.transporter || !this.config.email.from) return { delivered: false };
    try { await this.transporter.sendMail({ from: this.config.email.from, to: recipient, subject: 'Tes email Buzzerhood', text: 'Tes konfigurasi SMTP Buzzerhood berhasil.' }); return { delivered: true }; }
    catch { return { delivered: false }; }
  }

  async sendPartnerApplicationDecision(application: PublicPartnerApplicationDecisionEmail): Promise<void> {
    const approved = application.status === 'approved';
    const subject = approved ? 'Pendaftaran Buzzerhood Network disetujui' : 'Pendaftaran Buzzerhood Network belum dapat disetujui';
    const decision = approved
      ? 'Pendaftaran Anda telah disetujui. Tim Buzzerhood akan menghubungi Anda untuk langkah aktivasi berikutnya.'
      : 'Pendaftaran Anda belum dapat kami setujui saat ini.';
    const note = application.reviewNote ? `\n\nCatatan tim:\n${application.reviewNote}` : '';
    await this.send({ to: application.email, subject, text: `Halo ${application.fullName},\n\n${decision}${note}\n\nTim Buzzerhood` });
  }

  sendPartnerInvitation(input: { email: string; displayName: string; token: string }): Promise<void> {
    const url = `${this.config.email.publicWebUrl}/activate-partner?token=${encodeURIComponent(input.token)}`;
    return this.send({ to: input.email, subject: 'Aktifkan akun Partner Buzzerhood', text: `Halo ${input.displayName},\n\nBuat password melalui tautan berikut:\n${url}\n\nTautan berlaku 24 jam dan hanya dapat dipakai sekali.\n\nTim Buzzerhood` });
  }

  sendAccountInvitation(input: { email: string; displayName: string; token: string }): Promise<void> {
    const url = `${this.config.email.publicWebUrl}/activate-partner?token=${encodeURIComponent(input.token)}`;
    return this.send({ to: input.email, subject: 'Aktifkan akun Buzzerhood', text: `Halo ${input.displayName},\n\nAkun Buzzerhood Anda telah dibuat. Buat password melalui tautan berikut:\n${url}\n\nTautan berlaku 24 jam dan hanya dapat dipakai sekali.\n\nTim Buzzerhood` });
  }

  sendPasswordReset(input: { email: string; displayName: string | null; token: string }): Promise<void> {
    const url = `${this.config.email.publicWebUrl}/reset-password?token=${encodeURIComponent(input.token)}`;
    return this.send({ to: input.email, subject: 'Reset password Buzzerhood', text: `Halo ${input.displayName ?? 'Pengguna Buzzerhood'},\n\nGanti password melalui tautan berikut:\n${url}\n\nTautan berlaku 30 menit dan hanya dapat dipakai sekali.\n\nTim Buzzerhood` });
  }

  private async sendInternalNotification(application: PublicPartnerApplicationEmail): Promise<void> {
    if (!this.config.email.partnerApplicationNotificationEmail) return;
    await this.send({
      to: this.config.email.partnerApplicationNotificationEmail,
      subject: `Pendaftaran partner baru: ${application.fullName}`,
      text: `Pendaftaran partner baru masuk.\n\nID: ${application.id}\nNama: ${application.fullName}\nKategori: ${application.category}\nEmail: ${application.email}\nWhatsApp: ${application.whatsapp}\nKota: ${application.city}\nPesan: ${application.message ?? '-'}`
    });
  }

  private async sendInternalCampaignRequest(request: PublicCampaignRequestEmail): Promise<void> {
    if (!this.config.email.partnerApplicationNotificationEmail) return;
    await this.send({ to: this.config.email.partnerApplicationNotificationEmail, subject: `Brief campaign baru: ${request.organizationName}`, text: `Brief campaign baru masuk.\n\nID: ${request.id}\nNama: ${request.contactName}\nEmail: ${request.email}\nWhatsApp: ${request.whatsapp}\nOrganisasi: ${request.organizationName}\nKebutuhan: ${request.needType}\nPlatform: ${request.platformTarget}\nBrief: ${request.brief}` });
  }

  private async sendApplicantConfirmation(application: PublicPartnerApplicationEmail): Promise<void> {
    await this.send({
      to: application.email,
      subject: 'Pendaftaran Buzzerhood Network diterima',
      text: `Halo ${application.fullName},\n\nPendaftaran Anda sebagai ${application.category} telah kami terima. Tim Buzzerhood akan meninjau data Anda dan menghubungi melalui email atau WhatsApp.\n\nID aplikasi: ${application.id}\n\nTim Buzzerhood`
    });
  }

  private async send(message: { to: string; subject: string; text: string }): Promise<void> {
    if (!this.transporter || !this.config.email.from) {
      this.logger.warn({ event: 'email.skipped', reason: 'smtp_not_configured' }, 'Email tidak dikirim karena SMTP belum dikonfigurasi.');
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.config.email.from, ...message });
    } catch (error) {
      this.logger.error({ event: 'email.failed', errorType: error instanceof Error ? error.name : 'unknown' }, 'Pengiriman email gagal.');
    }
  }
}

