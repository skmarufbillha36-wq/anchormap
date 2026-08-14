'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { EyeOff, Trash2, Star, ChevronLeft, ChevronRight, Flag } from 'lucide-react';

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reviews', page, status],
    queryFn: () =>
      apiClient.get('/admin/reviews', { params: { page, limit: 25, status: status || undefined } })
        .then((r) => r.data),
  });

  const reviews = data?.data ?? [];
  const pagination = data?.pagination;

  const hideMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/reviews/${id}/hide`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reviews'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/reviews/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reviews'] }),
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9' }}>Reviews</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>Moderate user reviews</p>
        </div>
        <select className="input" style={{ maxWidth: 180 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Reviews</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>

      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 12, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '0.875rem' }}>Loading reviews…</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Reviewer</th><th>Location</th><th>Rating</th>
                <th>Content</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r: any) => (
                <tr key={r.id}>
                  <td>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f1f5f9' }}>{r.user?.name}</p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.user?.email}</p>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{r.location?.name}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map((n) => (
                        <Star key={n} size={13} fill={n <= r.rating ? '#f59e0b' : 'transparent'} color={n <= r.rating ? '#f59e0b' : '#334155'} strokeWidth={1.5} />
                      ))}
                    </div>
                  </td>
                  <td style={{ maxWidth: 220 }}>
                    <p style={{ fontSize: '0.82rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.content ?? <em style={{ color: '#475569' }}>No content</em>}
                    </p>
                    {r.flagCount > 0 && (
                      <span className="badge badge-red" style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Flag size={10} /> {r.flagCount} flags
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${r.status === 'published' ? 'badge-green' : r.status === 'hidden' ? 'badge-gray' : 'badge-red'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {r.status !== 'hidden' && (
                        <button className="btn btn-ghost btn-sm" title="Hide review" style={{ padding: '5px 8px' }} onClick={() => hideMutation.mutate(r.id)} disabled={hideMutation.isPending}>
                          <EyeOff size={13} />
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" title="Delete review" style={{ padding: '5px 8px' }} onClick={() => { if (confirm('Delete this review?')) deleteMutation.mutate(r.id); }} disabled={deleteMutation.isPending}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#475569', fontSize: '0.875rem' }}>No reviews found.</td></tr>
              )}
            </tbody>
          </table>
        )}
        {pagination && pagination.totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--surface-border)' }}>
            <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Page {pagination.page} of {pagination.totalPages}</p>
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
