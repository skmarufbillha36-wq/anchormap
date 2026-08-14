'use client';

import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { useMapStore } from '@/store/mapStore';
import { LocationSummary, ANKARA_CENTER, ANKARA_DEFAULT_ZOOM, ANKARA_MIN_ZOOM } from '@ankara-gis/types';
import apiClient from '@/lib/api';

// Category → icon color map
const CAT_COLORS: Record<string, string> = {
  education:       '#3b82f6',
  healthcare:      '#ef4444',
  emergency:       '#f97316',
  'public-services': '#8b5cf6',
  historical:      '#d97706',
  tourism:         '#10b981',
};

/** Classic SVG location pin (Google Maps style teardrop) */
function createColoredIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 46" width="32" height="46"
           style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.45)); display:block;">
        <path d="M16 0C7.16 0 0 7.16 0 16c0 10.4 16 30 16 30S32 26.4 32 16C32 7.16 24.84 0 16 0z"
              fill="${color}" />
        <circle cx="16" cy="16" r="7" fill="rgba(255,255,255,0.95)" />
        <circle cx="16" cy="16" r="4" fill="${color}" opacity="0.7" />
      </svg>
    `,
    iconSize: [32, 46],
    iconAnchor: [16, 46],
    popupAnchor: [0, -48],
  });
}

/** Animated drop pin for search results */
function createDropPinIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <style>
        @keyframes svgDrop {
          0%   { transform: translateY(-50px); opacity: 0; }
          60%  { transform: translateY(6px);  opacity: 1; }
          80%  { transform: translateY(-3px); }
          100% { transform: translateY(0); }
        }
        @keyframes svgPulse {
          0%,100% { opacity: 0.7; transform: scale(1); }
          50%      { opacity: 0.2; transform: scale(1.6); }
        }
        .anchor-drop-pin { animation: svgDrop 0.55s cubic-bezier(0.34,1.56,0.64,1) both; }
        .anchor-drop-shadow { animation: svgPulse 1.8s 0.55s ease-in-out infinite; }
      </style>
      <div style="position:relative; width:40px; height:56px;">
        <ellipse class="anchor-drop-shadow"
          cx="50%" cy="92%" rx="8" ry="4"
          style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);"
          fill="rgba(0,0,0,0.25)">
        </ellipse>
        <svg class="anchor-drop-pin" xmlns="http://www.w3.org/2000/svg"
             viewBox="0 0 32 46" width="40" height="56"
             style="filter: drop-shadow(0 4px 8px rgba(37,99,235,0.5));">
          <path d="M16 0C7.16 0 0 7.16 0 16c0 10.4 16 30 16 30S32 26.4 32 16C32 7.16 24.84 0 16 0z"
                fill="#2563eb" />
          <circle cx="16" cy="16" r="8" fill="rgba(255,255,255,0.95)" />
          <circle cx="16" cy="16" r="4.5" fill="#2563eb" opacity="0.8" />
        </svg>
      </div>
    `,
    iconSize: [40, 56],
    iconAnchor: [20, 56],
    popupAnchor: [0, -58],
  });
}

export default function MapCanvas() {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const clusterGroupRef = useRef<any>(null);
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map());

  const { bounds, setBounds, setZoom, setLocations, locations, activeCategoryId, selectLocation, categories, flyToTarget, setFlyToTarget } = useMapStore();

  // ─── Initialize map ───────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: ANKARA_CENTER,
      zoom: ANKARA_DEFAULT_ZOOM,
      minZoom: ANKARA_MIN_ZOOM,
      maxZoom: 18,
      zoomControl: false,
    });

    // OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Custom zoom control (bottom right)
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Marker cluster group
    const MarkerClusterGroup = (L as any).markerClusterGroup;
    if (MarkerClusterGroup) {
      const cluster = new MarkerClusterGroup({
        maxClusterRadius: 60,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        removeOutsideVisibleBounds: true,
        chunkedLoading: true,
      });
      map.addLayer(cluster);
      clusterGroupRef.current = cluster;
    }

    // On bounds change, fetch locations
    const onMoveEnd = () => {
      const b = map.getBounds();
      setBounds({
        minLat: b.getSouth(), maxLat: b.getNorth(),
        minLng: b.getWest(), maxLng: b.getEast(),
      });
      setZoom(map.getZoom());
    };

    map.on('moveend', onMoveEnd);
    map.on('zoomend', onMoveEnd);

    // Initial bounds
    const b = map.getBounds();
    setBounds({
      minLat: b.getSouth(), maxLat: b.getNorth(),
      minLng: b.getWest(), maxLng: b.getEast(),
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ─── Fly to target + drop animated pin ──────────────────
  const dropPinRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!flyToTarget || !mapRef.current) return;
    const { lat, lng, zoom = 17 } = flyToTarget; // capture before any state change
    const map = mapRef.current;

    if (dropPinRef.current) { dropPinRef.current.remove(); dropPinRef.current = null; }
    map.flyTo([lat, lng], zoom, { animate: true, duration: 1.2 });

    const timerId = window.setTimeout(() => {
      setFlyToTarget(null); // clear AFTER timer fires (not before)
      if (!mapRef.current) return;
      const pin = L.marker([lat, lng], { icon: createDropPinIcon(), zIndexOffset: 1000 });
      pin.addTo(mapRef.current);
      dropPinRef.current = pin;
      window.setTimeout(() => { pin.remove(); dropPinRef.current = null; }, 6000);
    }, 1300);

    return () => window.clearTimeout(timerId);
  }, [flyToTarget, setFlyToTarget]);

  // ─── Fetch locations when bounds/category change ───────────────
  useEffect(() => {
    if (!bounds) return;
    const { minLat, maxLat, minLng, maxLng } = bounds;
    const controller = new AbortController();

    apiClient
      .get('/locations', {
        params: { minLat, maxLat, minLng, maxLng, categoryId: activeCategoryId ?? undefined },
        signal: controller.signal,
      })
      .then(({ data }) => {
        setLocations(data.data ?? []);
      })
      .catch((err) => {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') console.error('Locations fetch error:', err);
      });

    return () => controller.abort();
  }, [bounds, activeCategoryId]);

  // ─── Update markers when locations change ─────────────────────
  useEffect(() => {
    const cluster = clusterGroupRef.current;
    if (!cluster) return;

    cluster.clearLayers();
    markerMapRef.current.clear();

    locations.forEach((loc: LocationSummary) => {
      // Resolve parent category for correct color grouping
      const cat = categories.find((c) => c.id === loc.categoryId);
      const parentCat = cat?.parentId ? categories.find((c) => c.id === cat.parentId) : cat;
      const color = CAT_COLORS[parentCat?.slug ?? ''] ?? CAT_COLORS[cat?.slug ?? ''] ?? '#64748b';
      const icon = createColoredIcon(color);

      const marker = L.marker([loc.lat, loc.lng], { icon });

      // Popup
      const primaryPhoto = loc.primaryPhotoUrl
        ? `<img src="${loc.primaryPhotoUrl}" alt="" style="width:100%;height:100px;object-fit:cover;border-radius:8px 8px 0 0;" />`
        : '';
      const rating = loc.avgRating
        ? `<span style="color:#f59e0b;">★</span> ${parseFloat(loc.avgRating as any).toFixed(1)}`
        : '';

      marker.bindPopup(`
        <div style="min-width:200px;max-width:240px;overflow:hidden;border-radius:12px;">
          ${primaryPhoto}
          <div style="padding:12px;">
            <p style="font-weight:700;font-size:0.9rem;color:#f1f5f9;margin-bottom:4px;">${loc.name}</p>
            ${loc.district ? `<p style="font-size:0.75rem;color:#94a3b8;margin-bottom:6px;">&#128205; ${loc.district}</p>` : ''}
            ${rating ? `<p style="font-size:0.78rem;">${rating} (${loc.reviewCount} reviews)</p>` : ''}
            <button
              onclick="window.anchorMap?.selectLocation('${loc.id}')"
              style="margin-top:10px;width:100%;padding:7px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.82rem;font-weight:600;"
            >View Details</button>
          </div>
        </div>
      `, { maxWidth: 240 });

      marker.on('click', () => selectLocation(loc.id));

      cluster.addLayer(marker);
      markerMapRef.current.set(loc.id, marker);
    });
  }, [locations, categories]);

  // Expose selectLocation to popup buttons
  useEffect(() => {
    (window as any).anchorMap = { selectLocation };
  }, [selectLocation]);

  return (
    <div
      ref={mapContainerRef}
      id="map"
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
    />
  );
}
