'use client';

import { useState, useEffect, use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Category } from '@ankara-gis/types';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Check } from 'lucide-react';

const CoordinatePicker = dynamic(() => import('@/components/admin/CoordinatePicker'), { ssr: false });

const ANKARA_DISTRICTS = [
  'Altındağ','Akyurt','Ayaş','Bala','Beypazarı','Çamlıdere','Çankaya','Çubuk',
  'Elmadağ','Etimesgut','Evren','Gölbaşı','Güdül','Haymana','Kalecik',
  'Kazan','Keçiören','Kızılcahamam','Mamak','Nallıhan','Polatlı',
  'Pursaklar','Sincan','Şereflikoçhisar','Yenimahalle',
];

export default function EditLocationPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 15/16 App Router: params is a Promise — must unwrap with React.use()
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);

  // ── Fetch the specific location by ID ─────────────────────────
  const { data: locData, isLoading: locLoading, error: locError } = useQuery({
    queryKey: ['admin', 'location', id],
    queryFn: () => apiClient.get(`/admin/locations/${id}`).then((r) => r.data.data),
    retry: false,
  });

  // ── Fetch categories ──────────────────────────────────────────
  const { data: catData } = useQuery<{ data: Category[] }>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/categories').then((r) => r.data),
  });
  const categories = catData?.data ?? [];
  const flatCats: Category[] = categories.flatMap((c) => [c, ...(c.children ?? [])]);

  // ── Populate form once data loads (only once) ─────────────────
  useEffect(() => {
    if (!locData || formInitialized) return;
    setForm({
      name:          locData.name        ?? '',
      nameTr:        locData.nameTr      ?? '',
      categoryId:    locData.categoryId  ?? '',
      district:      locData.district    ?? '',
      address:       locData.address     ?? '',
      phone:         locData.phone       ?? '',
      website:       locData.website     ?? '',
      email:         locData.email       ?? '',
      description:   locData.description ?? '',
      descriptionTr: locData.descriptionTr ?? '',
      status:        locData.status      ?? '',
      lat:           locData.lat != null  ? String(locData.lat)  : '',
      lng:           locData.lng != null  ? String(locData.lng)  : '',
    });
    setFormInitialized(true);
  }, [locData, formInitialized]);

  const updateMutation = useMutation({
    mutationFn: () =>
      apiClient.patch(`/admin/locations/${id}`, {
        ...form,
        lat: form.lat ? parseFloat(form.lat) : undefined,
        lng: form.lng ? parseFloat(form.lng) : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'locations'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
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

  function update(key: string, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  }

  if (locLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (locError || !locData) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#ef4444' }}>
        <p>Location not found (ID: {id})</p>
        <Link href="/admin/locations" className="btn btn-ghost btn-sm" style={{ marginTop: 16 }}>
          ← Back to Locations
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <Link href="/admin/locations" className="btn btn-ghost btn-sm">← Back</Link>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9' }}>
          Edit Location
        </h1>
        <code style={{ fontSize: '0.75rem', color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 6 }}>
          {id}
        </code>
      </div>

      {saved && (
        <div
          className="animate-fade-in"
          style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, color: '#86efac', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Check size={15} /> Location updated successfully
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left — form fields */}
        <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--surface-border)', padding: 24 }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#94a3b8', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Basic Information
          </h2>

          <div className="input-group">
            <label className="input-label">Name (English)*</label>
            <input className="input" value={form.name ?? ''} onChange={(e) => update('name', e.target.value)} placeholder="Name in English" />
            {errors.name && <span className="input-error">{errors.name}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">Name (Turkish)</label>
            <input className="input" value={form.nameTr ?? ''} onChange={(e) => update('nameTr', e.target.value)} placeholder="Türkçe isim" />
          </div>

          <div className="input-group">
            <label className="input-label">Category</label>
            <select className="input" value={form.categoryId ?? ''} onChange={(e) => update('categoryId', e.target.value)}>
              <option value="">— Select category —</option>
              {flatCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parentId ? `  └ ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">District</label>
            <select className="input" value={form.district ?? ''} onChange={(e) => update('district', e.target.value)}>
              <option value="">— Select district —</option>
              {ANKARA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Address</label>
            <input className="input" value={form.address ?? ''} onChange={(e) => update('address', e.target.value)} />
          </div>

          <div className="input-group">
            <label className="input-label">Phone</label>
            <input className="input" value={form.phone ?? ''} onChange={(e) => update('phone', e.target.value)} />
          </div>

          <div className="input-group">
            <label className="input-label">Website</label>
            <input className="input" value={form.website ?? ''} onChange={(e) => update('website', e.target.value)} />
          </div>

          <div className="input-group">
            <label className="input-label">Email</label>
            <input className="input" value={form.email ?? ''} onChange={(e) => update('email', e.target.value)} />
          </div>

          <div className="input-group">
            <label className="input-label">Description (EN)</label>
            <textarea className="input" style={{ resize: 'vertical', minHeight: 80 }}
              value={form.description ?? ''} onChange={(e) => update('description', e.target.value)} />
          </div>

          <div className="input-group">
            <label className="input-label">Description (TR)</label>
            <textarea className="input" style={{ resize: 'vertical', minHeight: 80 }}
              value={form.descriptionTr ?? ''} onChange={(e) => update('descriptionTr', e.target.value)} />
          </div>

          <div className="input-group">
            <label className="input-label">Status</label>
            <select className="input" value={form.status ?? ''} onChange={(e) => update('status', e.target.value)}>
              <option value="">— Unchanged —</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Right — coordinate picker + save */}
        <div>
          <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--surface-border)', padding: 24, marginBottom: 16 }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Location on Map
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Latitude</label>
                <input className="input" value={form.lat ?? ''} onChange={(e) => update('lat', e.target.value)} placeholder="39.9334" />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Longitude</label>
                <input className="input" value={form.lng ?? ''} onChange={(e) => update('lng', e.target.value)} placeholder="32.8597" />
              </div>
            </div>
            <CoordinatePicker
              lat={parseFloat(form.lat || '39.9334')}
              lng={parseFloat(form.lng || '32.8597')}
              onChange={(lat, lng) => { update('lat', lat.toFixed(6)); update('lng', lng.toFixed(6)); }}
            />
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', height: 48 }}
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending
              ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving…</>
              : <><Check size={15} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
