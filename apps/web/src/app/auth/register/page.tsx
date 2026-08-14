'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  function update(key: string, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const { data } = await apiClient.post('/auth/register', form);
      setAuth(data.data.user, data.data.accessToken);
      router.push('/');
    } catch (err: any) {
      const resp = err.response?.data;
      if (resp?.errors) {
        const flat: Record<string, string> = {};
        Object.entries(resp.errors).forEach(([k, v]) => {
          flat[k] = (v as string[])[0];
        });
        setErrors(flat);
      } else {
        setErrors({ root: resp?.message ?? 'Registration failed.' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel" style={{ padding: 32 }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
        Create your account
      </h2>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 28 }}>
        Join AnchorMap and explore Ankara
      </p>

      {errors.root && (
        <div
          style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 20,
            color: '#fca5a5', fontSize: '0.875rem',
          }}
        >
          {errors.root}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Full name</label>
          <input type="text" className="input" placeholder="Kemal Yılmaz"
            value={form.name} onChange={(e) => update('name', e.target.value)} required />
          {errors.name && <span className="input-error">{errors.name}</span>}
        </div>

        <div className="input-group">
          <label className="input-label">Email</label>
          <input type="email" className="input" placeholder="you@example.com"
            value={form.email} onChange={(e) => update('email', e.target.value)} required />
          {errors.email && <span className="input-error">{errors.email}</span>}
        </div>

        <div className="input-group">
          <label className="input-label">Password</label>
          <input type="password" className="input" placeholder="Min. 8 characters"
            value={form.password} onChange={(e) => update('password', e.target.value)} required />
          {errors.password && <span className="input-error">{errors.password}</span>}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', height: 44, marginTop: 8 }}
          disabled={loading}
        >
          {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating…</> : 'Create account'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 24, color: '#64748b', fontSize: '0.875rem' }}>
        Already have an account?{' '}
        <Link href="/auth/login" style={{ color: '#3b82f6', fontWeight: 600 }}>Sign in</Link>
      </p>
    </div>
  );
}
