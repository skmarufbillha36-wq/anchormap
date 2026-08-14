'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Pencil, Check, X, Trash2, ChevronLeft, ChevronRight, Star, Search } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  approved: '#22c55e',
  pending:  '#f59e0b',
  rejected: '#ef4444',
  deleted:  '#64748b',
};

export default function AdminLocationsPage() {
  const searchParams = useSearchParams();
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'locations', page, statusFilter, search],
    queryFn: () =>
      apiClient
        .get('/admin/locations', { params: { page, limit: 25, status: statusFilter || undefined, q: search || undefined } })
        .then((r) => r.data),
  });

  const locations = data?.data ?? [];
  const pagination = data?.pagination;

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/locations/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'locations'] }),
  });
  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/locations/${id}/reject`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'locations'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/locations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'locations'] }),
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9' }}>Locations</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
            {pagination ? `${pagination.total.toLocaleString()} total locations` : 'Manage all map locations'}
          </p>
        </div>
        <Link href="/admin/locations/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Plus size={15} /> Add Location
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', background: 'var(--surface-card)', borderRadius: 12, padding: 14, border: '1px solid var(--surface-border)', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 320 }}>
          <Search size={15} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input type="text" className="input" style={{ paddingLeft: 36 }} placeholder="Search by name…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input" style={{ flex: '0 0 160px' }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 12, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '0.875rem' }}>Loading locations…</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Category</th><th>District</th>
                <th>Status</th><th>Source</th><th>Rating</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc: any) => (
                <tr key={loc.id}>
                  <td>
                    <p style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.875rem' }}>{loc.name}</p>
                    {loc.nameTr && <p style={{ color: '#64748b', fontSize: '0.75rem' }}>{loc.nameTr}</p>}
                  </td>
                  <td>
                    <span className="badge" style={{ background: `${loc.category?.color ?? '#3b82f6'}20`, color: loc.category?.color ?? '#3b82f6' }}>
                      {loc.category?.name ?? '—'}
                    </span>
                  </td>
                  <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{loc.district ?? '—'}</td>
                  <td>
                    <span className="badge" style={{ background: `${STATUS_COLORS[loc.status] ?? '#64748b'}20`, color: STATUS_COLORS[loc.status] ?? '#64748b' }}>
                      {loc.status}
                    </span>
                  </td>
                  <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{loc.source}</td>
                  <td>
                    {loc.avgRating ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontSize: '0.85rem' }}>
                        <Star size={13} fill="#f59e0b" strokeWidth={0} />
                        {parseFloat(loc.avgRating).toFixed(1)}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <Link href={`/admin/locations/${loc.id}/edit`} className="btn btn-ghost btn-sm" title="Edit" aria-label="Edit" style={{ padding: '5px 8px' }}>
                        <Pencil size={13} />
                      </Link>
                      {loc.status === 'pending' && (
                        <>
                          <button className="btn btn-sm" title="Approve" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', padding: '5px 8px' }} onClick={() => approveMutation.mutate(loc.id)} disabled={approveMutation.isPending}>
                            <Check size={13} />
                          </button>
                          <button className="btn btn-sm" title="Reject" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', padding: '5px 8px' }} onClick={() => rejectMutation.mutate(loc.id)} disabled={rejectMutation.isPending}>
                            <X size={13} />
                          </button>
                        </>
                      )}
                      <button className="btn btn-danger btn-sm" title="Delete" style={{ padding: '5px 8px' }} onClick={() => { if (confirm(`Delete "${loc.name}"?`)) deleteMutation.mutate(loc.id); }} disabled={deleteMutation.isPending}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {locations.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#475569', fontSize: '0.875rem' }}>No locations found.</td></tr>
              )}
            </tbody>
          </table>
        )}
        {pagination && pagination.totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--surface-border)' }}>
            <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ChevronLeft size={14} /> Prev</button>
              <button className="btn btn-ghost btn-sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Next <ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
