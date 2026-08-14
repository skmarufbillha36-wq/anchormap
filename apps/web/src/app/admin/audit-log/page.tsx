'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminAuditLogPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-log', page],
    queryFn: () =>
      apiClient.get('/admin/audit-log', { params: { page, limit: 30 } }).then((r) => r.data),
  });

  const logs = data?.data ?? [];
  const pagination = data?.pagination;

  const ACTION_COLORS: Record<string, string> = {
    CREATE:  '#22c55e',
    UPDATE:  '#3b82f6',
    DELETE:  '#ef4444',
    APPROVE: '#10b981',
    REJECT:  '#f97316',
    HIDE:    '#8b5cf6',
    PROMOTE: '#f59e0b',
    RESTORE: '#06b6d4',
    FLAG:    '#f43f5e',
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9' }}>
          Audit Log
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: 4 }}>
          All admin actions are recorded here
        </p>
      </div>

      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 12, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />Loading…
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
            <FileText size={32} style={{ margin: '0 auto 12px', display: 'block' }} strokeWidth={1.5} />
            <p style={{ fontSize: '0.875rem' }}>No audit log entries yet</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Timestamp</th><th>Admin</th><th>Action</th><th>Entity</th><th>Details</th></tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f1f5f9' }}>{log.user?.name ?? 'System'}</p>
                    <p style={{ fontSize: '0.72rem', color: '#64748b' }}>{log.user?.email}</p>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: `${ACTION_COLORS[log.action] ?? '#64748b'}20`,
                        color: ACTION_COLORS[log.action] ?? '#94a3b8',
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    {log.entityType} <span style={{ color: '#475569', fontSize: '0.72rem' }}>#{log.entityId?.slice(0, 8)}</span>
                  </td>
                  <td style={{ maxWidth: 300 }}>
                    {log.changes && (
                      <pre style={{ fontSize: '0.72rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280, background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: 4 }}>
                        {JSON.stringify(log.changes)}
                      </pre>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--surface-border)' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Page {pagination.page} of {pagination.totalPages}</p>
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
