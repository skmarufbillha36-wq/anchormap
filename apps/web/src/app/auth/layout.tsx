import type { Metadata } from 'next';
import { Anchor } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign In — AnchorMap',
  description: 'Log in to your AnchorMap account',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, #1e3a5f 0%, #0f172a 60%)',
        padding: 24,
        overflow: 'auto',
      }}
    >
      {/* Background map pattern */}
      <div
        style={{
          position: 'fixed', inset: 0, opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M0 30 Q15 0 30 30 Q45 60 60 30' stroke='%234a9eff' stroke-width='0.5' fill='none'/%3E%3Cpath d='M0 0 Q30 15 60 0' stroke='%234a9eff' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 56, height: 56,
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              borderRadius: 14,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem',
              boxShadow: '0 4px 20px rgba(37,99,235,0.5)',
              marginBottom: 12,
            }}
          >
            <Anchor size={26} color="#fff" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: '#f1f5f9' }}>
            AnchorMap
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: 4 }}>Ankara City Guide</p>
        </div>

        {children}
      </div>
    </div>
  );
}
