'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMapStore } from '@/store/mapStore';
import apiClient from '@/lib/api';
import { Category } from '@ankara-gis/types';
import { Map, ChevronRight, ChevronDown } from 'lucide-react';
import { CategoryIcon } from '@/lib/icons';

export default function CategoryFilterPanel() {
  const { activeCategoryId, setActiveCategoryId, setCategories } = useMapStore();
  const [expandedParentId, setExpandedParentId] = useState<string | null>(null);

  const { data } = useQuery<{ data: Category[] }>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/categories').then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  });

  const parentCategories = data?.data ?? [];

  useEffect(() => {
    if (parentCategories.length > 0) {
      // Flatten parents + children so MapCanvas can resolve child IDs for colors
      const allCats = [
        ...parentCategories,
        ...parentCategories.flatMap((c) => (c as any).children ?? []),
      ];
      setCategories(allCats);
    }
  }, [parentCategories, setCategories]);

  function handleParentClick(cat: Category) {
    if (expandedParentId === cat.id) {
      // Collapse + clear filter
      setExpandedParentId(null);
      setActiveCategoryId(null);
    } else {
      // Expand sub-categories, but don't filter yet
      setExpandedParentId(cat.id);
      setActiveCategoryId(null);
    }
  }

  function handleChildClick(child: Category & { color?: string }) {
    setActiveCategoryId(child.id);
  }

  function handleAllClick() {
    setExpandedParentId(null);
    setActiveCategoryId(null);
  }

  const btnBase: React.CSSProperties = {
    width: '100%',
    padding: '9px 14px',
    borderRadius: 10,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
    fontSize: '0.82rem',
    fontWeight: 600,
    background: 'rgba(30,41,59,0.92)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)',
    textAlign: 'left' as const,
  };

  return (
    <div style={{
      position: 'absolute',
      left: 16,
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
      maxHeight: '80vh',
      overflowY: 'auto',
    }}>
      {/* All */}
      <button
        onClick={handleAllClick}
        style={{
          ...btnBase,
          border: !activeCategoryId && !expandedParentId
            ? '1px solid rgba(37,99,235,0.8)'
            : btnBase.border,
          background: !activeCategoryId && !expandedParentId
            ? 'rgba(37,99,235,0.2)'
            : btnBase.background,
          color: '#f1f5f9',
        }}
      >
        <Map size={15} strokeWidth={2} />
        <span>All</span>
      </button>

      {/* Parent categories */}
      {parentCategories.map((cat) => {
        const children: (Category & { color?: string })[] = (cat as any).children ?? [];
        const isExpanded = expandedParentId === cat.id;
        const hasActiveChild = children.some((c) => c.id === activeCategoryId);
        const color = (cat as any).color ?? '#3b82f6';

        return (
          <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Parent button */}
            <button
              onClick={() => handleParentClick(cat)}
              style={{
                ...btnBase,
                border: isExpanded || hasActiveChild ? `1px solid ${color}80` : btnBase.border,
                background: isExpanded || hasActiveChild ? `${color}22` : btnBase.background,
                color: isExpanded || hasActiveChild ? color : '#f1f5f9',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CategoryIcon slug={cat.slug} size={15} color={isExpanded || hasActiveChild ? color : '#94a3b8'} strokeWidth={2} />
                <span>{cat.name}</span>
              </span>
              {isExpanded
                ? <ChevronDown size={13} style={{ flexShrink: 0 }} />
                : <ChevronRight size={13} style={{ flexShrink: 0, opacity: 0.5 }} />
              }
            </button>

            {/* Sub-categories (visible when expanded) */}
            {isExpanded && children.map((child) => {
              const isActive = activeCategoryId === child.id;
              const childColor = child.color ?? color;
              return (
                <button
                  key={child.id}
                  onClick={() => handleChildClick(child)}
                  style={{
                    ...btnBase,
                    marginLeft: 16,
                    fontSize: '0.78rem',
                    padding: '7px 12px',
                    border: isActive ? `1px solid ${childColor}cc` : '1px solid rgba(255,255,255,0.05)',
                    background: isActive ? `${childColor}33` : 'rgba(15,23,42,0.7)',
                    color: isActive ? childColor : '#94a3b8',
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  <CategoryIcon slug={child.slug} size={13} color={isActive ? childColor : '#64748b'} strokeWidth={2} />
                  <span>{child.name}</span>
                  {isActive && (
                    <span style={{
                      marginLeft: 'auto',
                      width: 7, height: 7,
                      borderRadius: '50%',
                      background: childColor,
                      flexShrink: 0,
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
