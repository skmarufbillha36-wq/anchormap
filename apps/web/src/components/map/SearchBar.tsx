'use client';

import { useState, useEffect, useRef } from 'react';
import { useMapStore } from '@/store/mapStore';
import apiClient from '@/lib/api';
import { LocationSummary } from '@ankara-gis/types';
import { Search, X, MapPin } from 'lucide-react';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { selectLocation, setFlyToTarget } = useMapStore();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get('/search', { params: { q: query } });
        setResults(data.data ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, [query]);

  function handleSelect(loc: LocationSummary) {
    setQuery(loc.name);
    setOpen(false);
    selectLocation(loc.id);
    // Fly the map to the selected location
    setFlyToTarget({ lat: loc.lat, lng: loc.lng, zoom: 17 });
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 80, left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: '100%', maxWidth: 480,
        padding: '0 16px',
      }}
    >
      <div style={{ position: 'relative' }}>
        {/* Search icon */}
        <div style={{
          position: 'absolute', left: 14, top: '50%',
          transform: 'translateY(-50%)',
          color: '#64748b', display: 'flex', alignItems: 'center', pointerEvents: 'none',
        }}>
          <Search size={17} strokeWidth={2} />
        </div>

        <input
          type="search"
          className="input"
          style={{
            paddingLeft: 44, paddingRight: 44,
            borderRadius: 12,
            background: 'rgba(30,41,59,0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            height: 48, fontSize: '0.95rem',
          }}
          placeholder="Search locations in Ankara…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />

        {/* Spinner or clear button */}
        <div style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          display: 'flex', alignItems: 'center',
        }}>
          {loading
            ? <div className="spinner" style={{ width: 16, height: 16 }} />
            : query
              ? (
                <button
                  onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
                  aria-label="Clear search"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#64748b', display: 'flex', alignItems: 'center',
                    padding: 2, borderRadius: 4,
                  }}
                >
                  <X size={16} />
                </button>
              )
              : null
          }
        </div>
      </div>

      {/* Results dropdown */}
      {open && results.length > 0 && (
        <div
          className="glass-panel animate-fade-in"
          style={{ marginTop: 8, maxHeight: 320, overflowY: 'auto' }}
        >
          {results.map((loc) => (
            <button
              key={loc.id}
              onClick={() => handleSelect(loc)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                width: '100%', padding: '11px 16px',
                background: 'none', border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <MapPin size={14} color="#64748b" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.875rem', display: 'block' }}>
                  {loc.name}
                </span>
                {loc.district && (
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                    {loc.district}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {open && results.length === 0 && query.length >= 2 && !loading && (
        <div className="glass-panel" style={{ marginTop: 8, padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
          No results for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
