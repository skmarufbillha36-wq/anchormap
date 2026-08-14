'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { Check, X, Lightbulb } from 'lucide-react';

export default function AdminSuggestionsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('pending');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'suggestions', page, status],
    queryFn: () =>
      apiClient.get('/admin/suggestions', { params: { page, limit: 25, status: status || undefined } }).then((r) => r.data),
  });

  const suggestions = data?.data ?? [];
  const pagination = data?.pagination;

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/suggestions/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'suggestions'] }),
  });
  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/suggestions/${id}/reject`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'suggestions'] }),
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9' }}>Suggestions</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>User-submitted location requests</p>
        </div>
        <select className="input" style={{ maxWidth: 180 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 12, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '0.875rem' }}>Loading suggestions…</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#475569' }}>
            <Lightbulb size={32} style={{ margin: '0 auto 12px', display: 'block' }} strokeWidth={1.5} />
            <p style={{ fontSize: '0.875rem' }}>No suggestions with status &ldquo;{status}&rdquo;</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Submitted by</th><th>Location</th><th>Description</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {suggestions.map((s: any) => (
                <tr key={s.id}>
                  <td>
                    <p style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.875rem' }}>{s.name}</p>
                    {s.nameTr && <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.nameTr}</p>}
                  </td>
                  <td>
                    <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{s.suggester?.name ?? 'Anonymous'}</p>
                    <p style={{ fontSize: '0.72rem', color: '#64748b' }}>{s.suggester?.email}</p>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    {Number(s.lat).toFixed(4)}, {Number(s.lng).toFixed(4)}
                    {s.address && <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>{s.address}</p>}
                  </td>
                  <td style={{ maxWidth: 200 }}>
                    <p style={{ fontSize: '0.82rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.description ?? '—'}
                    </p>
                  </td>
                  <td>
                    <span className={`badge ${s.status === 'pending' ? 'badge-amber' : s.status === 'approved' ? 'badge-green' : 'badge-gray'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td>
                    {s.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button
                          className="btn btn-sm" title="Approve"
                          style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 5 }}
                          onClick={() => approveMutation.mutate(s.id)} disabled={approveMutation.isPending}
                        >
                          <Check size={13} /> Approve
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 5 }}
                          onClick={() => rejectMutation.mutate(s.id)} disabled={rejectMutation.isPending}
                        >
                          <X size={13} /> Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
