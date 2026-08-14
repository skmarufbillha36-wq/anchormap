'use client';

import { useEffect, useState } from 'react';
import { useMapStore } from '@/store/mapStore';
import apiClient from '@/lib/api';
import { Location } from '@ankara-gis/types';
import Image from 'next/image';
import Link from 'next/link';
import ReviewsSection from './ReviewsSection';
import { MapPin, X, Phone, Globe, Clock, Tag } from 'lucide-react';

type FullLocation = Location & { lat: number; lng: number };

export default function LocationSidebar() {
  const { selectedLocationId, isSidebarOpen, selectLocation } = useMapStore();
  const [location, setLocation] = useState<FullLocation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedLocationId) { setLocation(null); return; }

    setLoading(true);
    setLocation(null);

    // Use the public GET /locations/:slug endpoint — it now also accepts UUIDs
    apiClient
      .get(`/locations/${selectedLocationId}`)
      .then((r) => setLocation(r.data.data ?? null))
      .catch(() => setLocation(null))
      .finally(() => setLoading(false));
  }, [selectedLocationId]);

  if (!isSidebarOpen) return null;

  return (
    <div
      className="glass-panel animate-slide-right"
      style={{
        position: 'absolute',
        right: 16,
        top: 80,
        bottom: 16,
        width: 'var(--sidebar-width)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>
          {location ? location.name : 'Location Details'}
        </h2>
        <button
          onClick={() => selectLocation(null)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#94a3b8', lineHeight: 1,
          }}
          aria-label="Close sidebar"
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>

        {/* Loading */}
        {loading && (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: 12, color: '#94a3b8', fontSize: '0.875rem' }}>Loading…</p>
          </div>
        )}

        {/* Error / not found */}
        {!loading && !location && selectedLocationId && (
          <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
            <MapPin size={36} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} strokeWidth={1.5} />
            <p style={{ fontSize: '0.875rem', marginBottom: 16 }}>Could not load location details.</p>
            <Link
              href={`/locations/${selectedLocationId}`}
              style={{
                display: 'inline-block',
                padding: '8px 16px', background: '#2563eb',
                color: '#fff', borderRadius: 8, fontSize: '0.875rem',
                textDecoration: 'none', fontWeight: 600,
              }}
            >
              Open Full Page →
            </Link>
          </div>
        )}

        {/* Location data */}
        {!loading && location && (
          <>
            {/* Photo hero */}
            {location.photos?.[0] && (
              <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
                <Image
                  src={location.photos[0].url}
                  alt={location.name}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="400px"
                />
              </div>
            )}
            {!location.photos?.[0] && (
              <div style={{
                height: 100,
                background: `linear-gradient(135deg, ${location.category?.color ?? '#2563eb'}22, transparent)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MapPin size={32} color={location.category?.color ?? '#3b82f6'} strokeWidth={1.5} style={{ opacity: 0.5 }} />
              </div>
            )}

            {/* Content */}
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Category badge */}
              {location.category && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                  background: `${location.category.color ?? '#3b82f6'}20`,
                  color: location.category.color ?? '#3b82f6',
                  alignSelf: 'flex-start',
                }}>
                  {location.category.name}
                </span>
              )}

              {/* District */}
              {location.district && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: '0.83rem' }}>
                  <MapPin size={13} strokeWidth={2} />
                  <span>{location.district}, Ankara</span>
                </div>
              )}

              {/* Address */}
              {location.address && (
                <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0 }}>{location.address}</p>
              )}

              {/* Phone */}
              {location.phone && (
                <a href={`tel:${location.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#3b82f6', fontSize: '0.83rem', textDecoration: 'none' }}>
                  <Phone size={13} strokeWidth={2} />
                  <span>{location.phone}</span>
                </a>
              )}

              {/* Website */}
              {location.website && (
                <a href={location.website} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#3b82f6', fontSize: '0.83rem', textDecoration: 'none' }}>
                  <Globe size={13} strokeWidth={2} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {location.website.replace(/^https?:\/\//, '')}
                  </span>
                </a>
              )}

              {/* Opening hours */}
              {(location as any).hoursJson?.raw && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#94a3b8', fontSize: '0.82rem' }}>
                  <Clock size={13} strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{(location as any).hoursJson.raw}</span>
                </div>
              )}

              {/* Tags */}
              {location.tags?.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexWrap: 'wrap' }}>
                  <Tag size={12} strokeWidth={2} style={{ color: '#64748b', marginTop: 3, flexShrink: 0 }} />
                  {location.tags.slice(0, 4).map((t: string) => (
                    <span key={t} style={{
                      padding: '2px 7px', background: 'rgba(255,255,255,0.06)',
                      borderRadius: 4, fontSize: '0.72rem', color: '#64748b',
                    }}>{t}</span>
                  ))}
                </div>
              )}

              {/* Rating */}
              {location.avgRating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.83rem' }}>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>★ {parseFloat(String(location.avgRating)).toFixed(1)}</span>
                  <span style={{ color: '#64748b' }}>({location.reviewCount} reviews)</span>
                </div>
              )}

              {/* Open Full Page */}
              <Link
                href={`/locations/${location.slug}`}
                style={{
                  display: 'block', marginTop: 4,
                  padding: '10px 14px',
                  background: 'rgba(37,99,235,0.15)',
                  border: '1px solid rgba(37,99,235,0.4)',
                  color: '#60a5fa',
                  borderRadius: 10,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  textAlign: 'center',
                  transition: 'background 0.2s',
                }}
              >
                Open Full Page →
              </Link>
            </div>

            {/* Reviews */}
            <ReviewsSection locationId={location.id} />
          </>
        )}
      </div>
    </div>
  );
}
