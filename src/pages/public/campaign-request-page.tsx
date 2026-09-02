import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';

const requestSchema = z.object({ name: z.string().min(2, 'Masukkan nama.'), email: z.string().email('Masukkan email valid.'), company: z.string().min(2, 'Masukkan organisasi.'), message: z.string().min(10, 'Ceritakan kebutuhan campaign.'), });
type RequestValues = z.infer<typeof requestSchema>;
export function CampaignRequestPage({ partner }: { partner?: boolean }) {
  const { register, handleSubmit, formState: { errors, isSubmitSuccessful } } = useForm<RequestValues>({ resolver: zodResolver(requestSchema) });
  const title = partner ? 'Bergabung sebagai partner' : 'Diskusikan campaign';
  return <main className="auth-page"><Link className="brand" to="/">BUZZER<span>HOOD</span></Link><section className="auth-card"><p className="eyebrow">PUBLIC FORM SHELL</p><h1>{title}</h1><p>Form tervalidasi. Integrasi submission aman belum diaktifkan pada Phase 1.</p><form onSubmit={handleSubmit(() => undefined)} noValidate><label>Nama<input {...register('name')} /></label>{errors.name ? <small>{errors.name.message}</small> : null}<label>Email<input type="email" {...register('email')} /></label>{errors.email ? <small>{errors.email.message}</small> : null}<label>{partner ? 'Organisasi / nama channel' : 'Perusahaan / organisasi'}<input {...register('company')} /></label>{errors.company ? <small>{errors.company.message}</small> : null}<label>Kebutuhan<textarea rows={5} {...register('message')} /></label>{errors.message ? <small>{errors.message.message}</small> : null}<button className="btn-solid" type="submit">Kirim permintaan</button>{isSubmitSuccessful ? <p className="form-message">Draft form valid. Submission backend akan ditambahkan pada fase workflow.</p> : null}</form></section></main>;
}
