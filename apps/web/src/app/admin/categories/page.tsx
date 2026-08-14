'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { useState } from 'react';
import { Category } from '@ankara-gis/types';
import { Plus, X, Trash2, Check, ChevronRight } from 'lucide-react';
import { CategoryIcon, getCategoryIcon } from '@/lib/icons';

// ─── Icon selector for the form ───────────────────────────────────────────────
const ICON_OPTIONS = [
  { slug: 'education',        label: 'Education'         },
  { slug: 'healthcare',       label: 'Healthcare'        },
  { slug: 'emergency',        label: 'Emergency'         },
  { slug: 'public-services',  label: 'Public Services'   },
  { slug: 'historical',       label: 'Historical'        },
  { slug: 'tourism',          label: 'Tourism'           },
  { slug: 'hospital',         label: 'Hospital'          },
  { slug: 'school',           label: 'School'            },
  { slug: 'library',          label: 'Library'           },
  { slug: 'university',       label: 'University'        },
  { slug: 'pharmacy',         label: 'Pharmacy'          },
  { slug: 'dentist',          label: 'Dentist'           },
  { slug: 'police-station',   label: 'Police'            },
  { slug: 'fire-station',     label: 'Fire'              },
  { slug: 'bank',             label: 'Bank'              },
  { slug: 'museum',           label: 'Museum'            },
  { slug: 'park',             label: 'Park'              },
  { slug: 'hotel',            label: 'Hotel'             },
];

function IconPicker({ value, onChange }: { value: string; onChange: (slug: string) => void }) {
  return (
    <div>
      <label className="input-label">Icon</label>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))',
        gap: 6, marginTop: 6,
      }}>
        {ICON_OPTIONS.map(({ slug, label }) => {
          const Icon = getCategoryIcon(slug);
          const isSelected = value === slug;
          return (
            <button
              key={slug}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={isSelected}
              onClick={() => onChange(slug)}
              style={{
                width: '100%', aspectRatio: '1',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                borderRadius: 8, border: isSelected ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.08)',
                background: isSelected ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                cursor: 'pointer', transition: 'all 0.15s', padding: 6,
                color: isSelected ? '#c4b5fd' : '#64748b',
              }}
            >
              <Icon size={18} strokeWidth={2} />
              <span style={{ fontSize: '0.6rem', lineHeight: 1, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Category row ──────────────────────────────────────────────────────────────
function CategoryRow({
  cat, isChild = false, onDelete,
}: {
  cat: Category & { _count?: { locations: number } }; isChild?: boolean; onDelete: (id: string, name: string) => void;
}) {
  const color = cat.color ?? '#3b82f6';
  const iconSlug = cat.icon ?? (isChild ? cat.slug : cat.slug);
  const locationCount = (cat as any)._count?.locations ?? null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr auto auto auto auto',
        alignItems: 'center',
        gap: 12,
        padding: isChild ? '10px 16px 10px 52px' : '14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: isChild ? 'rgba(0,0,0,0.12)' : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      {/* Fixed-size icon container */}
      <div
        style={{
          width: 40, height: 40, flexShrink: 0,
          borderRadius: isChild ? 8 : 10,
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color,
        }}
      >
        <CategoryIcon slug={iconSlug} size={isChild ? 16 : 18} strokeWidth={2} />
      </div>

      {/* Name + TR name */}
      <div style={{ minWidth: 0 }}>
        <p style={{
          fontWeight: isChild ? 500 : 700,
          fontSize: isChild ? '0.85rem' : '0.925rem',
          color: isChild ? '#94a3b8' : '#f1f5f9',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {cat.name}
        </p>
        {cat.nameTr && (
          <p style={{
            fontSize: '0.75rem', color: '#475569', marginTop: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {cat.nameTr}
          </p>
        )}
      </div>

      {/* Location count */}
      {locationCount !== null && (
        <span style={{
          fontSize: '0.72rem', color: locationCount > 0 ? '#22c55e' : '#475569',
          background: locationCount > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
          padding: '3px 8px', borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {locationCount.toLocaleString()} POIs
        </span>
      )}

      {/* Color swatch */}
      <div
        title={color}
        style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }}
      />

      {/* Slug badge */}
      <code style={{
        fontSize: '0.72rem', color: '#475569',
        background: 'rgba(255,255,255,0.05)',
        padding: '3px 7px', borderRadius: 4,
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {cat.slug}
      </code>

      {/* Delete button */}
      <button
        className="btn btn-danger btn-sm"
        title={`Delete "${cat.name}"`}
        aria-label={`Delete category ${cat.name}`}
        onClick={() => onDelete(cat.id, cat.name)}
        style={{ flexShrink: 0, padding: '6px 8px' }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '', nameTr: '', slug: '', icon: 'education', color: '#3b82f6', parentId: '',
  });
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery<{ data: Category[] }>({
    queryKey: ['admin', 'categories'],
    queryFn: () => apiClient.get('/admin/categories').then((r) => r.data),
  });

  const categories = data?.data ?? [];
  const topLevel = categories.filter((c) => !c.parentId);

  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/admin/categories', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setShowForm(false);
      setForm({ name: '', nameTr: '', slug: '', icon: 'education', color: '#3b82f6', parentId: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  });

  function handleDelete(id: string, name: string) {
    if (confirm(`Delete category "${name}"? This may affect existing locations.`)) {
      deleteMutation.mutate(id);
    }
  }

  // Auto-generate slug from name
  function handleNameChange(name: string) {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setForm((p) => ({ ...p, name, slug: p.slug === '' || p.slug === p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') ? slug : p.slug }));
  }

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9' }}>
            Categories
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
            Manage location categories and subcategories
          </p>
        </div>
        <button
          className={showForm ? 'btn btn-ghost' : 'btn btn-primary'}
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: 7 }}
        >
          {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Add Category</>}
        </button>
      </div>

      {/* ── Create Form ── */}
      {showForm && (
        <div
          className="animate-fade-in"
          style={{
            background: 'var(--surface-card)',
            borderRadius: 14, border: '1px solid var(--surface-border)',
            padding: 24, marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            New Category
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Name (EN)*</label>
              <input
                className="input" value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Healthcare"
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Name (TR)</label>
              <input
                className="input" value={form.nameTr}
                onChange={(e) => setForm((p) => ({ ...p, nameTr: e.target.value }))}
                placeholder="e.g. Sağlık"
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">URL Slug*</label>
              <input
                className="input" value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                placeholder="e.g. healthcare"
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color" value={form.color}
                  onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                  style={{ width: 40, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'none', padding: 2 }}
                />
                <input
                  className="input" value={form.color}
                  onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
              </div>
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Parent Category</label>
              <select
                className="input" value={form.parentId}
                onChange={(e) => setForm((p) => ({ ...p, parentId: e.target.value }))}
              >
                <option value="">None (top-level)</option>
                {topLevel.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Icon picker */}
          <div style={{ marginBottom: 20 }}>
            <IconPicker value={form.icon} onChange={(slug) => setForm((p) => ({ ...p, icon: slug }))} />
          </div>

          <button
            className="btn btn-primary"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !form.name || !form.slug}
            style={{ display: 'flex', alignItems: 'center', gap: 7 }}
          >
            {createMutation.isPending
              ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving…</>
              : <><Check size={15} /> Create Category</>
            }
          </button>
        </div>
      )}

      {/* ── Tree view ── */}
      {isLoading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: '0.875rem' }}>Loading categories…</p>
        </div>
      ) : topLevel.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#475569' }}>
          <p style={{ fontSize: '0.875rem' }}>No categories yet. Add one above.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {topLevel.map((cat) => (
            <div
              key={cat.id}
              style={{
                background: 'var(--surface-card)',
                border: `1px solid ${(cat.color ?? '#3b82f6')}28`,
                borderRadius: 12, overflow: 'hidden',
              }}
            >
              {/* Parent row */}
              <CategoryRow cat={cat} onDelete={handleDelete} />

              {/* Children */}
              {cat.children?.map((sub: Category) => (
                <CategoryRow key={sub.id} cat={sub} isChild onDelete={handleDelete} />
              ))}

              {/* Add subcategory hint */}
              {(cat.children?.length ?? 0) === 0 && (
                <div style={{
                  padding: '8px 16px 8px 52px',
                  fontSize: '0.75rem', color: '#334155',
                  borderTop: '1px solid rgba(255,255,255,0.04)',
                  background: 'rgba(0,0,0,0.08)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <ChevronRight size={12} />
                  No subcategories
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
