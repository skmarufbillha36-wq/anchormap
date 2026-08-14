import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: {
    default: 'AnchorMap — Ankara City Guide',
    template: '%s | AnchorMap',
  },
  description:
    'Explore Ankara with AnchorMap — find hospitals, schools, historical sites, restaurants, and more on an interactive map of Turkey\'s capital.',
  keywords: ['Ankara', 'map', 'city guide', 'Turkey', 'GIS', 'hospital', 'museum', 'university'],
  authors: [{ name: 'AnchorMap' }],
  openGraph: {
    type: 'website',
    title: 'AnchorMap — Ankara City Guide',
    description: 'Interactive map and city guide for Ankara, Turkey',
    siteName: 'AnchorMap',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css"
          crossOrigin=""
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
