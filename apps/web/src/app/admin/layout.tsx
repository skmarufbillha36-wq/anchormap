'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import {
  LayoutDashboard, MapPin, FolderTree, Star,
  Flag, Lightbulb, Users, FileText, Anchor,
  ArrowLeft, LogOut, Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin',             Icon: LayoutDashboard, label: 'Dashboard'   },
  { href: '/admin/locations',   Icon: MapPin,           label: 'Locations'   },
  { href: '/admin/categories',  Icon: FolderTree,       label: 'Categories'  },
  { href: '/admin/reviews',     Icon: Star,             label: 'Reviews'     },
  { href: '/admin/reports',     Icon: Flag,             label: 'Reports'     },
  { href: '/admin/suggestions', Icon: Lightbulb,        label: 'Suggestions' },
  { href: '/admin/users',       Icon: Users,            label: 'Users'       },
  { href: '/admin/audit-log',   Icon: FileText,         label: 'Audit Log'   },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, clearAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.replace('/auth/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div className="spinner" />
      </div>
    );
  }

  async function handleLogout() {
    try { const { default: api } = await import('@/lib/api'); await api.post('/auth/logout'); } catch { /* ignore */ }
    clearAuth();
    router.replace('/auth/login');
  }

  return (
    <div className="admin-layout">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="admin-sidebar">
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'linear-gradient(135deg, #6d28d9, #4c1d95)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(109,40,217,0.4)',
            }}>
              <Anchor size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#f1f5f9' }}>
                AnchorMap
              </p>
              <p style={{ fontSize: '0.65rem', color: '#8b5cf6' }}>Admin Console</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '10px 10px', flex: 1 }}>
          {NAV_ITEMS.map(({ href, Icon, label }) => {
            const isActive = pathname === href ||
              (href !== '/admin' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11,
                  padding: '9px 12px', borderRadius: 9, marginBottom: 2,
                  textDecoration: 'none', transition: 'all 0.15s',
                  background: isActive ? 'rgba(139,92,246,0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                  color: isActive ? '#c4b5fd' : '#94a3b8',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User info + actions */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {user.name[0].toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </p>
              <p style={{ fontSize: '0.7rem', color: '#8b5cf6' }}>Administrator</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Link
              href="/"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, flex: 1,
                fontSize: '0.75rem', color: '#64748b', textDecoration: 'none',
                padding: '6px 10px', borderRadius: 7,
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'color 0.15s',
              }}
            >
              <ArrowLeft size={13} />
              Back to Map
            </Link>
            <button
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '6px 10px', borderRadius: 7,
                border: '1px solid rgba(239,68,68,0.2)',
                background: 'rgba(239,68,68,0.06)',
                color: '#ef4444', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────── */}
      <main className="admin-main">{children}</main>
    </div>
  );
}
