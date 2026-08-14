import { create } from 'zustand';
import { User } from '@ankara-gis/types';
import apiClient from '@/lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;

  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  loadFromStorage: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,

  setAuth: (user, accessToken) => {
    localStorage.setItem('access_token', accessToken);
    set({ user, accessToken, isLoading: false });
  },

  clearAuth: () => {
    localStorage.removeItem('access_token');
    set({ user: null, accessToken: null, isLoading: false });
  },

  loadFromStorage: () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      set({ isLoading: false });
      return;
    }
    set({ accessToken: token });
  },

  fetchMe: async () => {
    try {
      const { data } = await apiClient.get('/auth/me');
      set({ user: data.data, isLoading: false });
    } catch {
      localStorage.removeItem('access_token');
      set({ user: null, accessToken: null, isLoading: false });
    }
  },
}));
