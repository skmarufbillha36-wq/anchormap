'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
  Anchor, User, Heart, Settings, LogOut, ChevronDown, ChevronUp, Shield,
} from 'lucide-react';

export default function Header() {
  const { user, clearAuth } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    try { await apiClient.post('/auth/logout'); } catch { /* ignore */ }
    clearAuth();
    setMenuOpen(false);
    router.replace('/auth/login');
  }

  return (
    <header
      className="glass-panel"
      style={{
        position: 'absolute',
        top: 16, left: 16, right: 16,
        zIndex: 1001,
        padding: '0 20px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 14,
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <div style={{
          width: 34, height: 34,
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(37,99,235,0.4)',
        }}>
          <Anchor size={17} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#f1f5f9' }}>
            AnchorMap
          </span>
          <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', lineHeight: 1 }}>
            Ankara City Guide
          </span>
        </div>
      </Link>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {!user ? (
          <>
            <Link href="/auth/login" className="btn btn-ghost btn-sm">Log in</Link>
            <Link href="/auth/register" className="btn btn-primary btn-sm">Sign up</Link>
          </>
        ) : (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '5px 12px', cursor: 'pointer',
                color: '#f1f5f9',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: '#2563eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {user.name[0].toUpperCase()}
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.name}</span>
              {user.role === 'ADMIN' && (
                <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>ADMIN</span>
              )}
              {menuOpen
                ? <ChevronUp size={14} color="#64748b" />
                : <ChevronDown size={14} color="#64748b" />
              }
            </button>

            {menuOpen && (
              <div
                className="glass-panel animate-fade-in"
                style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  minWidth: 200, padding: '8px',
                  zIndex: 2000,
                }}
              >
                <MenuItem href="/profile"   Icon={User}     label="My Profile"   onClick={() => setMenuOpen(false)} />
                <MenuItem href="/favorites" Icon={Heart}    label="My Favorites" onClick={() => setMenuOpen(false)} />
                {user.role === 'ADMIN' && (
                  <>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '6px 0' }} />
                    <MenuItem href="/admin" Icon={Settings} label="Admin Dashboard" onClick={() => setMenuOpen(false)} />
                  </>
                )}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '6px 0' }} />
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '8px 12px', borderRadius: 8,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#ef4444', fontSize: '0.875rem', fontWeight: 500,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <LogOut size={15} /> Log out
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

function MenuItem({ href, Icon, label, onClick }: {
  href: string;
  Icon: React.FC<{ size?: number; strokeWidth?: number }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 8,
        color: '#f1f5f9', fontSize: '0.875rem', fontWeight: 500,
        textDecoration: 'none', transition: 'background 0.15s',
      }}
      onMouseEnter={(e: any) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
      onMouseLeave={(e: any) => (e.currentTarget.style.background = 'none')}
    >
      <Icon size={15} strokeWidth={2} /> {label}
    </Link>
  );
}
