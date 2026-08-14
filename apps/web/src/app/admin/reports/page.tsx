'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  wrong_location: 'Wrong Location', wrong_info: 'Wrong Info',
  permanently_closed: 'Permanently Closed', duplicate: 'Duplicate',
  inappropriate: 'Inappropriate', other: 'Other',
};

export default function AdminReportsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('open');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', page, status],
    queryFn: () =>
      apiClient.get('/admin/reports', { params: { page, limit: 25, status: status || undefined } }).then((r) => r.data),
  });

  const reports = data?.data ?? [];
  const pagination = data?.pagination;

  const resolveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/admin/reports/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9' }}>Reports</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>User-submitted location issues</p>
        </div>
        <select className="input" style={{ maxWidth: 180 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Reports</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 12, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '0.875rem' }}>Loading reports…</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Location</th><th>Type</th><th>Description</th><th>Status</th><th>Reported</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {reports.map((r: any) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f1f5f9' }}>{r.location?.name ?? '—'}</td>
                  <td><span className="badge badge-red" style={{ fontSize: '0.72rem' }}>{TYPE_LABELS[r.type] ?? r.type ?? '—'}</span></td>
                  <td style={{ maxWidth: 240 }}>
                    <p style={{ fontSize: '0.82rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.description ?? <em style={{ color: '#475569' }}>No description</em>}
                    </p>
                  </td>
                  <td>
                    <span className={`badge ${r.status === 'open' ? 'badge-orange' : r.status === 'resolved' ? 'badge-green' : 'badge-gray'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    {r.status === 'open' && (
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button
                          className="btn btn-sm" title="Resolve"
                          style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 5 }}
                          onClick={() => resolveMutation.mutate({ id: r.id, status: 'resolved' })}
                          disabled={resolveMutation.isPending}
                        >
                          <Check size={13} /> Resolve
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 5 }}
                          onClick={() => resolveMutation.mutate({ id: r.id, status: 'dismissed' })}
                          disabled={resolveMutation.isPending}
                        >
                          <X size={13} /> Dismiss
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#475569', fontSize: '0.875rem' }}>No reports found.</td></tr>
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
