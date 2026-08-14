'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      setAuth(data.data.user, data.data.accessToken);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel" style={{ padding: 32 }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
        Welcome back
      </h2>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 28 }}>
        Sign in to your AnchorMap account
      </p>

      {error && (
        <div
          style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 20,
            color: '#fca5a5', fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Email</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="input-group">
          <label className="input-label">Password</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', height: 44, marginTop: 8 }}
          disabled={loading}
        >
          {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in…</> : 'Sign in'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 24, color: '#64748b', fontSize: '0.875rem' }}>
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" style={{ color: '#3b82f6', fontWeight: 600 }}>
          Sign up
        </Link>
      </p>
    </div>
  );
}
