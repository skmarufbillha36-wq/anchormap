'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Review } from '@ankara-gis/types';
import { Star } from 'lucide-react';

interface Props { locationId: string; }

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= (hovered || value);
        return (
          <button
            key={n} type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, lineHeight: 1, transition: 'transform 0.1s', transform: active ? 'scale(1.1)' : 'scale(1)' }}
          >
            <Star size={22} fill={active ? '#f59e0b' : 'transparent'} color={active ? '#f59e0b' : '#334155'} strokeWidth={1.5} />
          </button>
        );
      })}
    </div>
  );
}

export default function ReviewsSection({ locationId }: Props) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');

  const { data, isLoading } = useQuery<{ data: Review[] }>({
    queryKey: ['reviews', locationId],
    queryFn: () => apiClient.get(`/locations/${locationId}/reviews`).then((r) => r.data),
  });
  const reviews = data?.data ?? [];

  const submitMutation = useMutation({
    mutationFn: () => apiClient.post(`/locations/${locationId}/reviews`, { rating, content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reviews', locationId] }); setRating(0); setContent(''); },
  });

  return (
    <div>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>
        Reviews ({reviews.length})
      </h3>

      {user && (
        <form
          onSubmit={(e) => { e.preventDefault(); if (rating > 0) submitMutation.mutate(); }}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 16, marginBottom: 20 }}
        >
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 10 }}>Your review</p>
          <StarPicker value={rating} onChange={setRating} />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your experience… (optional)"
            style={{ width: '100%', marginTop: 12, padding: 10, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f1f5f9', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical', minHeight: 80 }}
          />
          <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: 10, width: '100%' }} disabled={rating === 0 || submitMutation.isPending}>
            {submitMutation.isPending ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      )}

      {isLoading && <div className="skeleton" style={{ height: 80, marginBottom: 12 }} />}

      {reviews.length === 0 && !isLoading && (
        <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
          No reviews yet. Be the first!
        </p>
      )}

      {reviews.map((r) => (
        <div key={r.id} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {r.user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f1f5f9' }}>{r.user?.name ?? 'Anonymous'}</p>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1,2,3,4,5].map((n) => (
                  <Star key={n} size={12} fill={n <= r.rating ? '#f59e0b' : 'transparent'} color={n <= r.rating ? '#f59e0b' : '#334155'} strokeWidth={1.5} />
                ))}
              </div>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#64748b' }}>
              {new Date(r.createdAt).toLocaleDateString()}
            </span>
          </div>
          {r.content && <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>{r.content}</p>}
        </div>
      ))}
    </div>
  );
}
