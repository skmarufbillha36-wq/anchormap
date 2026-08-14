import Link from 'next/link';
import type { Metadata } from 'next';
import { Map, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = { title: 'Page Not Found — AnchorMap' };

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, #1e3a5f 0%, #0f172a 60%)',
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        padding: 24,
      }}
    >
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, color: '#1d4ed8', opacity: 0.6 }}>
          <Map size={80} strokeWidth={1} />
        </div>
        <h1
          style={{
            fontFamily: 'Outfit, sans-serif', fontSize: '3rem', fontWeight: 800,
            color: '#f1f5f9', marginBottom: 8,
          }}
        >
          404
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#94a3b8', marginBottom: 8 }}>
          This location doesn&apos;t exist on the map.
        </p>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 32 }}>
          The page you&apos;re looking for might have been moved or deleted.
        </p>
        <Link href="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <ArrowLeft size={15} /> Back to Map
        </Link>
      </div>
    </div>
  );
}
