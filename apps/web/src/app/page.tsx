'use client';

import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import CategoryFilterPanel from '@/components/map/CategoryFilterPanel';
import LocationSidebar from '@/components/map/LocationSidebar';
import SearchBar from '@/components/map/SearchBar';

// Leaflet MUST be loaded client-side only (accesses window/document)
// 'use client' on this page allows ssr: false with next/dynamic
const MapCanvas = dynamic(() => import('@/components/map/MapCanvas'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '100vh',
        width: '100%',
        background: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
        <div
          style={{
            width: 48,
            height: 48,
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <p style={{ fontFamily: 'Inter, sans-serif' }}>Loading Ankara Map…</p>
      </div>
    </div>
  ),
});

export default function HomePage() {
  return (
    <div className="app-layout">
      {/* Full-screen map canvas */}
      <MapCanvas />

      {/* Overlaid UI panels */}
      <Header />
      <SearchBar />
      <CategoryFilterPanel />
      <LocationSidebar />
    </div>
  );
}
