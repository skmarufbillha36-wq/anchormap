'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import Link from 'next/link';
import { Heart, MapPin, ChevronRight, ArrowLeft } from 'lucide-react';

export default function FavoritesPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/auth/login');
  }, [user, isLoading, router]);

  const { data, isLoading: favLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => apiClient.get('/favorites').then((r) => r.data),
    enabled: !!user,
  });

  const favorites = data?.data ?? [];

  if (isLoading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '32px 24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <Link href="/" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={14} /> Map</Link>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9' }}>
            My Favorites
          </h1>
        </div>

        {favLoading && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        )}

        {!favLoading && favorites.length === 0 && (
          <div
            className="glass-panel animate-fade-in"
            style={{ padding: 60, textAlign: 'center' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <Heart size={48} color="#ef4444" strokeWidth={1.5} />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
              No favorites yet
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: 24 }}>
              Explore the map and save locations you love.
            </p>
            <Link href="/" className="btn btn-primary">Explore the Map</Link>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {favorites.map((fav: any) => (
            <Link
              key={fav.id}
              href={`/locations/${fav.location?.slug ?? ''}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="card animate-fade-in"
                style={{ display: 'flex', alignItems: 'center', gap: 16 }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(37,99,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={22} color="#3b82f6" strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' }}>
                    {fav.location?.name ?? 'Unknown location'}
                  </p>
                  {fav.location?.district && (
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                      {fav.location.district}, Ankara
                    </p>
                  )}
                </div>
                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                  {new Date(fav.createdAt).toLocaleDateString()}
                </span>
                <ChevronRight size={16} color="#64748b" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
