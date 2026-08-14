'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import Link from 'next/link';
import { Heart, Settings, LogOut, Check } from 'lucide-react';

export default function ProfilePage() {
  const { user, isLoading, clearAuth } = useAuthStore();
  const router = useRouter();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/auth/login');
    if (user) setName(user.name);
  }, [user, isLoading, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.patch('/auth/me', { name });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function handleLogout() {
    try { await apiClient.post('/auth/logout'); } catch { /* ignore */ }
    clearAuth();
    router.push('/');
  }

  if (isLoading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '32px 24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <Link href="/" className="btn btn-ghost btn-sm">← Map</Link>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9' }}>
            My Profile
          </h1>
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
          <div
            style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: 800, color: '#fff',
              boxShadow: '0 4px 20px rgba(37,99,235,0.4)',
            }}
          >
            {user.name[0].toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f1f5f9' }}>{user.name}</p>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{user.email}</p>
            <span className={`badge ${user.role === 'ADMIN' ? 'badge-purple' : 'badge-blue'}`} style={{ marginTop: 6 }}>
              {user.role}
            </span>
          </div>
        </div>

        {/* Edit form */}
        <div
          className="glass-panel"
          style={{ padding: 28, marginBottom: 20 }}
        >
          <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#94a3b8', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Account Settings
          </h2>

          {success && (
            <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, color: '#86efac', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={15} /> Profile updated successfully
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="input-group">
              <label className="input-label">Display Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input className="input" value={user.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Quick links */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <Link href="/favorites" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', color: '#f1f5f9', textDecoration: 'none', fontSize: '0.875rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Heart size={16} strokeWidth={2} /> My Favorites
          </Link>
          {user.role === 'ADMIN' && (
            <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', color: '#c4b5fd', textDecoration: 'none', fontSize: '0.875rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <Settings size={16} strokeWidth={2} /> Admin Dashboard
            </Link>
          )}
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.875rem', width: '100%', textAlign: 'left' }}>
            <LogOut size={16} strokeWidth={2} /> Log out
          </button>
        </div>
      </div>
    </div>
  );
}
