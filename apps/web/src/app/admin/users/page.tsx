'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { ShieldCheck, ShieldOff, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page],
    queryFn: () => apiClient.get('/admin/users', { params: { page, limit: 25 } }).then((r) => r.data),
  });

  const users = data?.data ?? [];
  const pagination = data?.pagination;

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      apiClient.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9' }}>Users</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
          {pagination ? `${pagination.total} registered accounts` : 'Manage user accounts'}
        </p>
      </div>

      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 12, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '0.875rem' }}>Loading users…</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Provider</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: u.role === 'ADMIN' ? 'linear-gradient(135deg,#8b5cf6,#6d28d9)' : '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {u.name[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.875rem' }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-purple' : 'badge-blue'}`}>{u.role}</span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{u.provider}</td>
                  <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    {u.role !== 'ADMIN' ? (
                      <button
                        className="btn btn-ghost btn-sm" title="Promote to Admin"
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => { if (confirm(`Promote ${u.name} to ADMIN?`)) roleMutation.mutate({ id: u.id, role: 'ADMIN' }); }}
                        disabled={roleMutation.isPending}
                      >
                        <ShieldCheck size={13} /> Promote
                      </button>
                    ) : (
                      <button
                        className="btn btn-danger btn-sm" title="Demote to User"
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => { if (confirm(`Demote ${u.name} to USER?`)) roleMutation.mutate({ id: u.id, role: 'USER' }); }}
                        disabled={roleMutation.isPending}
                      >
                        <ShieldOff size={13} /> Demote
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#475569', fontSize: '0.875rem' }}>No users found.</td></tr>
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
