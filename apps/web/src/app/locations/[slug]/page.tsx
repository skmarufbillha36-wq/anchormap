import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import LocationClientSection from '@/components/location/LocationClientSection';
import { Star, MapPin, Home, Phone, Globe, Mail, ArrowLeft } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

async function getLocation(slug: string) {
  try {
    const res = await fetch(`${API_URL}/locations/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const location = await getLocation(slug);
  if (!location) return { title: 'Location Not Found' };

  return {
    title: `${location.name} — AnchorMap`,
    description: location.description ?? `Explore ${location.name} on AnchorMap, Ankara's city guide.`,
    openGraph: {
      title: location.name,
      description: location.description,
      images: location.photos?.[0]?.url ? [location.photos[0].url] : [],
    },
  };
}

function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={16} fill={n <= Math.round(rating) ? '#f59e0b' : 'transparent'} color={n <= Math.round(rating) ? '#f59e0b' : '#334155'} strokeWidth={1.5} />
      ))}
    </div>
  );
}

function InfoRow({ Icon, label, href, external }: {
  Icon: React.FC<LucideProps>;
  label: string;
  href?: string;
  external?: boolean;
}) {
  const content = (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <Icon size={16} style={{ flexShrink: 0, marginTop: 2, color: '#64748b' }} />
      <span style={{ color: href ? '#3b82f6' : '#94a3b8', fontSize: '0.9rem', wordBreak: 'break-word' }}>{label}</span>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        style={{ textDecoration: 'none' }}
      >
        {content}
      </a>
    );
  }

  return content;
}

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const location = await getLocation(slug);

  if (!location) notFound();

  const primaryPhoto = location.photos?.find((p: any) => p.isPrimary) ?? location.photos?.[0];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--surface-bg)',
        overflowY: 'auto',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Hero */}
      <div style={{ position: 'relative', height: 300, background: 'var(--surface-card)' }}>
        {primaryPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primaryPhoto.url}
            alt={location.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ height: '100%', background: 'linear-gradient(135deg, #1e3a5f, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={80} color="#3b82f6" strokeWidth={1} style={{ opacity: 0.3 }} />
          </div>
        )}
        {/* Back button */}
        <Link
          href="/"
          style={{
            position: 'absolute', top: 20, left: 20,
            background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)',
            borderRadius: 10, padding: '8px 16px',
            color: '#f1f5f9', fontSize: '0.85rem', fontWeight: 600,
            textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <ArrowLeft size={14} /> Back to Map
        </Link>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
          {/* Left — main content */}
          <div>
            {/* Category badge */}
            {location.category && (
              <span
                className="badge"
                style={{
                  background: `${location.category.color ?? '#3b82f6'}20`,
                  color: location.category.color ?? '#3b82f6',
                  marginBottom: 12, display: 'inline-flex',
                }}
              >
                {location.category.name}
              </span>
            )}

            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 6 }}>
              {location.name}
            </h1>

            {location.nameTr && location.nameTr !== location.name && (
              <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: 12 }}>{location.nameTr}</p>
            )}

            {/* Rating */}
            {location.avgRating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Stars rating={location.avgRating} />
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>{parseFloat(location.avgRating).toFixed(1)}</span>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>({location.reviewCount} reviews)</span>
              </div>
            )}

            {/* Info grid */}
            <div
              style={{
                background: 'var(--surface-card)', borderRadius: 14,
                border: '1px solid var(--surface-border)', padding: 24, marginBottom: 24,
              }}
            >
              <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
                Location Info
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {location.district && <InfoRow Icon={MapPin} label={`${location.district}, Ankara`} />}
                {location.address && <InfoRow Icon={Home} label={location.address} />}
                {location.phone && <InfoRow Icon={Phone} label={location.phone} href={`tel:${location.phone}`} />}
                {location.website && (
                  <InfoRow
                    Icon={Globe}
                    label={location.website.replace(/^https?:\/\//, '')}
                    href={location.website}
                    external
                  />
                )}
                {location.email && <InfoRow Icon={Mail} label={location.email} href={`mailto:${location.email}`} />}
              </div>
            </div>

            {/* Description */}
            {location.description && (
              <div
                style={{
                  background: 'var(--surface-card)', borderRadius: 14,
                  border: '1px solid var(--surface-border)', padding: 24, marginBottom: 24,
                }}
              >
                <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                  About
                </h2>
                <p style={{ color: '#94a3b8', lineHeight: 1.7, fontSize: '0.95rem' }}>{location.description}</p>
              </div>
            )}

            {/* Tags */}
            {location.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {location.tags.map((tag: string) => (
                  <span key={tag} className="badge badge-gray">{tag}</span>
                ))}
              </div>
            )}

            {/* Reviews — rendered by client component */}
            <LocationClientSection location={location} reviewsOnly />
          </div>

          {/* Right — map + actions (all client-side) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <LocationClientSection location={location} mapOnly />
          </div>
        </div>
      </div>
    </div>
  );
}
