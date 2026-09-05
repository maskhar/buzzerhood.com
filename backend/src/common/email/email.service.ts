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

  async sendPartnerApplicationDecision(application: PublicPartnerApplicationDecisionEmail): Promise<void> {
    const approved = application.status === 'approved';
    const subject = approved ? 'Pendaftaran Buzzerhood Network disetujui' : 'Pendaftaran Buzzerhood Network belum dapat disetujui';
    const decision = approved
      ? 'Pendaftaran Anda telah disetujui. Tim Buzzerhood akan menghubungi Anda untuk langkah aktivasi berikutnya.'
      : 'Pendaftaran Anda belum dapat kami setujui saat ini.';
    const note = application.reviewNote ? `\n\nCatatan tim:\n${application.reviewNote}` : '';
    await this.send({ to: application.email, subject, text: `Halo ${application.fullName},\n\n${decision}${note}\n\nTim Buzzerhood` });
  }

  private async sendInternalNotification(application: PublicPartnerApplicationEmail): Promise<void> {
    if (!this.config.email.partnerApplicationNotificationEmail) return;
    await this.send({
      to: this.config.email.partnerApplicationNotificationEmail,
      subject: `Pendaftaran partner baru: ${application.fullName}`,
      text: `Pendaftaran partner baru masuk.\n\nID: ${application.id}\nNama: ${application.fullName}\nKategori: ${application.category}\nEmail: ${application.email}\nWhatsApp: ${application.whatsapp}\nKota: ${application.city}\nPesan: ${application.message ?? '-'}`
    });
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
