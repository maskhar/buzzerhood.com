import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { hasApiConfig } from '@/app/config/environment';
import { apiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/features/auth/use-auth';
import { loginSchema, type LoginValues } from '@/lib/validation/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [message, setMessage] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const onSubmit = async (values: LoginValues) => {
    if (!hasApiConfig) { setMessage('Backend API belum dikonfigurasi. Tambahkan VITE_API_BASE_URL pada .env lokal.'); return; }
    try { await signIn(values); } catch (error) { setMessage(apiErrorMessage(error, 'Login gagal. Periksa email dan password.')); return; }
    const from = (location.state as { from?: string } | null)?.from ?? '/app';
    navigate(from, { replace: true });
  };
  return <main className="auth-page"><Link className="brand" to="/">BUZZER<span>HOOD</span></Link><section className="auth-card"><p className="eyebrow">ACCOUNT ACCESS</p><h1>Masuk ke workspace</h1><p>Login memakai Backend Buzzerhood. Akses workspace diverifikasi server-side.</p><form onSubmit={handleSubmit(onSubmit)} noValidate><label>Email<input type="email" autoComplete="email" {...register('email')} /></label>{errors.email ? <small>{errors.email.message}</small> : null}<label>Password<input type="password" autoComplete="current-password" {...register('password')} /></label>{errors.password ? <small>{errors.password.message}</small> : null}<button className="btn-solid" disabled={isSubmitting} type="submit">{isSubmitting ? 'Memproses…' : 'Masuk'}</button>{message ? <p className="form-message">{message}</p> : null}</form></section></main>;
}
