'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Navigation } from 'lucide-react';

// Leaflet mini-map must be client-only (accesses window)
const LocationMiniMap = dynamic(
  () => import('@/components/location/LocationMiniMap'),
  { ssr: false, loading: () => <div style={{ height: 200, background: '#1e293b' }} /> }
);

// ReviewsSection uses TanStack Query hooks — must be client
const ReviewsSection = dynamic(
  () => import('@/components/map/ReviewsSection'),
  { ssr: false, loading: () => <div style={{ padding: 20, color: '#64748b' }}>Loading reviews…</div> }
);

interface Props {
  location: any;
  /** Render only the reviews card (left column) */
  reviewsOnly?: boolean;
  /** Render only map + action buttons (right column) */
  mapOnly?: boolean;
}

export default function LocationClientSection({ location, reviewsOnly, mapOnly }: Props) {
  if (reviewsOnly) {
    return (
      <div
        style={{
          background: 'var(--surface-card)', borderRadius: 14,
          border: '1px solid var(--surface-border)', padding: 24,
        }}
      >
        <ReviewsSection locationId={location.id} />
      </div>
    );
  }

  if (mapOnly) {
    return (
      <>
        {/* Mini-map */}
        <div
          style={{
            background: 'var(--surface-card)', borderRadius: 14,
            border: '1px solid var(--surface-border)', overflow: 'hidden',
          }}
        >
          <LocationMiniMap lat={location.lat} lng={location.lng} name={location.name} />
        </div>

        {/* Direction buttons */}
        <div
          style={{
            background: 'var(--surface-card)', borderRadius: 14,
            border: '1px solid var(--surface-border)', padding: 16,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}
        >
          <Link
            href={`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 7 }}
          >
            <Navigation size={15} /> Get Directions
          </Link>
          <Link
            href={`https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=17/${location.lat}/${location.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
            style={{ justifyContent: 'center' }}
          >
            Open in OpenStreetMap
          </Link>
        </div>

        {/* Coordinates */}
        <div
          style={{
            background: 'var(--surface-card)', borderRadius: 14,
            border: '1px solid var(--surface-border)', padding: 16,
          }}
        >
          <p style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.6 }}>
            <strong style={{ color: '#64748b' }}>Coordinates:</strong>{' '}
            {location.lat?.toFixed(6)}, {location.lng?.toFixed(6)}<br />
            {location.source === 'osm' && (
              <>
                <strong style={{ color: '#64748b' }}>Source:</strong>{' '}
                <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                  OpenStreetMap
                </a>{' '}contributors
              </>
            )}
          </p>
        </div>
      </>
    );
  }

  return null;
}
