import axios from 'axios';

// Production: set NEXT_PUBLIC_API_URL=https://anchormap-lnom.onrender.com/api/v1 in Vercel env vars
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://anchormap-lnom.onrender.com/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true,
});

// Attach JWT access token from localStorage to every request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 — clear auth state and redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
