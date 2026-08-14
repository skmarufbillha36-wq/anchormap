'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

function AuthLoader({ children }: { children: React.ReactNode }) {
  const { loadFromStorage, fetchMe, accessToken } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (accessToken) fetchMe();
  }, [accessToken, fetchMe]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthLoader>{children}</AuthLoader>
    </QueryClientProvider>
  );
}
