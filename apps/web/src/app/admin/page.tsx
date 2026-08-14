'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import Link from 'next/link';
import {
  MapPin, Clock, CheckCircle, Users, Star, Flag,
  Plus, RefreshCw, Lightbulb, type LucideProps,
} from 'lucide-react';

interface Stats {
  totalLocations: number;
  pending: number;
  approved: number;
  totalUsers: number;
  totalReviews: number;
  openReports: number;
}

function StatCard({
  label, value, Icon, color, href,
}: {
  label: string;
  value: number | undefined;
  Icon: React.FC<LucideProps>;
  color: string;
  href?: string;
}) {
  const content = (
    <div
      className="card"
      style={{
        background: `linear-gradient(135deg, ${color}12, ${color}06)`,
        border: `1px solid ${color}28`,
        borderRadius: 14, padding: '22px 20px',
        display: 'flex', flexDirection: 'column', gap: 12,
        cursor: href ? 'pointer' : 'default',
        transition: 'all 0.2s',
        minHeight: 110,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color,
        }}>
          <Icon size={18} strokeWidth={2} />
        </div>
        {value !== undefined && (
          <span style={{
            fontSize: '1.9rem', fontWeight: 800,
            fontFamily: 'Outfit, sans-serif', color,
          }}>
            {value.toLocaleString()}
          </span>
        )}
      </div>
      <p style={{
        fontSize: '0.78rem', color: '#64748b',
        fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        {label}
      </p>
    </div>
  );

  if (href) return <Link href={href} style={{ textDecoration: 'none' }}>{content}</Link>;
  return content;
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery<{ data: Stats }>({
    queryKey: ['admin', 'stats'],
    queryFn: () => apiClient.get('/admin/stats').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const stats = data?.data;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9' }}>
          Dashboard
        </h1>
        <p style={{ color: '#64748b', marginTop: 4, fontSize: '0.875rem' }}>
          AnchorMap admin overview
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16, marginBottom: 40 }}>
        <StatCard label="Total Locations" value={stats?.totalLocations} Icon={MapPin}      color="#3b82f6" href="/admin/locations" />
        <StatCard label="Pending Approval" value={stats?.pending}        Icon={Clock}       color="#f59e0b" href="/admin/locations?status=pending" />
        <StatCard label="Approved"          value={stats?.approved}       Icon={CheckCircle} color="#22c55e" href="/admin/locations?status=approved" />
        <StatCard label="Total Users"       value={stats?.totalUsers}     Icon={Users}       color="#8b5cf6" href="/admin/users" />
        <StatCard label="Reviews"           value={stats?.totalReviews}   Icon={Star}        color="#f97316" href="/admin/reviews" />
        <StatCard label="Open Reports"      value={stats?.openReports}    Icon={Flag}        color="#ef4444" href="/admin/reports" />
      </div>

      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b', marginBottom: 32 }}>
          <div className="spinner" />
          <span style={{ fontSize: '0.875rem' }}>Loading statistics…</span>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/admin/locations/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Plus size={15} /> Add Location
          </Link>
          <Link href="/admin/locations?status=pending" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Clock size={15} /> Review Pending
          </Link>
          <Link href="/admin/reports?status=open" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Flag size={15} /> Handle Reports
          </Link>
          <Link href="/admin/suggestions?status=pending" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Lightbulb size={15} /> Review Suggestions
          </Link>
        </div>
      </div>
    </div>
  );
}
