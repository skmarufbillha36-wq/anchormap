'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Category } from '@ankara-gis/types';
import dynamic from 'next/dynamic';
import { MapPin, Check, Save } from 'lucide-react';

// Map picker loaded client-side only
const CoordinatePicker = dynamic(() => import('@/components/admin/CoordinatePicker'), { ssr: false });

interface FormData {
  name: string;
  nameTr: string;
  categoryId: string;
  lat: string;
  lng: string;
  district: string;
  address: string;
  description: string;
  phone: string;
  website: string;
  status: string;
}

const ANKARA_DISTRICTS = [
  'Altındağ','Akyurt','Ayaş','Bala','Beypazarı','Çamlıdere','Çankaya','Çubuk',
  'Elmadağ','Etimesgut','Evren','Gölbaşı','Güdül','Haymana','Kalecik',
  'Kazan','Keçiören','Kızılcahamam','Mamak','Nallıhan','Polatlı',
  'Pursaklar','Sincan','Şereflikoçhisar','Yenimahalle',
];

export default function NewLocationPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [form, setForm] = useState<FormData>({
    name: '', nameTr: '', categoryId: '', lat: '39.9334', lng: '32.8597',
    district: '', address: '', description: '', phone: '', website: '', status: 'approved',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: catData } = useQuery<{ data: Category[] }>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/categories').then((r) => r.data),
  });
  const categories = catData?.data ?? [];

  // Flatten categories for select
  const flatCats: Category[] = categories.flatMap((c) => [c, ...(c.children ?? [])]);

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/admin/locations', {
        ...form,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'locations'] });
      router.push('/admin/locations');
    },
    onError: (err: any) => {
      const resp = err.response?.data;
      if (resp?.errors) {
        const flat: Record<string, string> = {};
        Object.entries(resp.errors).forEach(([k, v]) => { flat[k] = (v as string[])[0]; });
        setErrors(flat);
      }
    },
  });

  function update(key: keyof FormData, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm">← Back</button>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9' }}>
          New Location
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left col — form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div
            style={{
              background: 'var(--surface-card)', borderRadius: 14,
              border: '1px solid var(--surface-border)', padding: 24,
            }}
          >
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#94a3b8', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Basic Information
            </h2>

            <div className="input-group">
              <label className="input-label">Name (English)*</label>
              <input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Hacettepe University" />
              {errors.name && <span className="input-error">{errors.name}</span>}
            </div>

            <div className="input-group">
              <label className="input-label">Name (Turkish)</label>
              <input className="input" value={form.nameTr} onChange={(e) => update('nameTr', e.target.value)} placeholder="e.g. Hacettepe Üniversitesi" />
            </div>

            <div className="input-group">
              <label className="input-label">Category*</label>
              <select className="input" value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)}>
                <option value="">Select category…</option>
                {flatCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parentId ? `  └ ${c.name}` : c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <span className="input-error">{errors.categoryId}</span>}
            </div>

            <div className="input-group">
              <label className="input-label">District</label>
              <select className="input" value={form.district} onChange={(e) => update('district', e.target.value)}>
                <option value="">Select district…</option>
                {ANKARA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Address</label>
              <input className="input" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Full address" />
            </div>

            <div className="input-group">
              <label className="input-label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+90 312 000 0000" />
            </div>

            <div className="input-group">
              <label className="input-label">Website</label>
              <input className="input" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://…" />
            </div>

            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea
                className="input"
                style={{ resize: 'vertical', minHeight: 100 }}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Brief description of the location…"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Status</label>
              <select className="input" value={form.status} onChange={(e) => update('status', e.target.value)}>
                <option value="approved">Approved (visible on map)</option>
                <option value="pending">Pending (needs review)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right col — coordinate picker */}
        <div>
          <div
            style={{
              background: 'var(--surface-card)', borderRadius: 14,
              border: '1px solid var(--surface-border)', padding: 24, marginBottom: 16,
            }}
          >
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Location on Map
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Latitude</label>
                <input className="input" value={form.lat} onChange={(e) => update('lat', e.target.value)} />
                {errors.lat && <span className="input-error">{errors.lat}</span>}
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Longitude</label>
                <input className="input" value={form.lng} onChange={(e) => update('lng', e.target.value)} />
                {errors.lng && <span className="input-error">{errors.lng}</span>}
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={13} /> Click on the map to set the exact position
            </p>

            <CoordinatePicker
              lat={parseFloat(form.lat)}
              lng={parseFloat(form.lng)}
              onChange={(lat, lng) => {
                update('lat', lat.toFixed(6));
                update('lng', lng.toFixed(6));
              }}
            />
          </div>

          {/* Submit */}
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', height: 48 }}
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending
               ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving…</>
               : <><Check size={15} /> Create Location</>}
          </button>
        </div>
      </div>
    </div>
  );
}
