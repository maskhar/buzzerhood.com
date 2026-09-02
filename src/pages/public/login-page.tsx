import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { hasSupabaseConfig } from '@/app/config/environment';
import { loginSchema, type LoginValues } from '@/lib/validation/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const onSubmit = async (values: LoginValues) => {
    if (!hasSupabaseConfig) { setMessage('Supabase belum dikonfigurasi. Tambahkan variabel pada .env lokal.'); return; }
    const { getSupabaseClient } = await import('@/lib/supabase/client');
    const { error } = await getSupabaseClient().auth.signInWithPassword(values);
    if (error) { setMessage('Login gagal. Periksa email dan password.'); return; }
    const from = (location.state as { from?: string } | null)?.from ?? '/app';
    navigate(from, { replace: true });
  };
  return <main className="auth-page"><Link className="brand" to="/">BUZZER<span>HOOD</span></Link><section className="auth-card"><p className="eyebrow">ACCOUNT ACCESS</p><h1>Masuk ke workspace</h1><p>Login Supabase disiapkan untuk dashboard. Role dan organisasi diverifikasi pada fase RBAC.</p><form onSubmit={handleSubmit(onSubmit)} noValidate><label>Email<input type="email" autoComplete="email" {...register('email')} /></label>{errors.email ? <small>{errors.email.message}</small> : null}<label>Password<input type="password" autoComplete="current-password" {...register('password')} /></label>{errors.password ? <small>{errors.password.message}</small> : null}<button className="btn-solid" disabled={isSubmitting} type="submit">{isSubmitting ? 'Memproses…' : 'Masuk'}</button>{message ? <p className="form-message">{message}</p> : null}</form></section></main>;
}
