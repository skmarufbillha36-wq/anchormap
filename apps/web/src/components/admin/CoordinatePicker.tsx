'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

interface Props {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export default function CoordinatePicker({ lat, lng, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat || 39.9334, lng || 32.8597],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    const marker = L.marker([lat || 39.9334, lng || 32.8597], { draggable: true }).addTo(map);
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onChange(pos.lat, pos.lng);
    });
    markerRef.current = marker;

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChange(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync marker position when props change (e.g. manual input)
  useEffect(() => {
    if (markerRef.current && lat && lng) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current?.setView([lat, lng], mapRef.current.getZoom());
    }
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      style={{
        height: 300,
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    />
  );
}
