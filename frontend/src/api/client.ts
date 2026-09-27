import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Attach start timestamp for response timing
  (config as any)._startTime = Date.now();
  console.debug(`[API] → ${config.method?.toUpperCase()} ${config.url}`, config.params || '');
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const elapsed = Date.now() - ((response.config as any)._startTime || Date.now());
    console.info(`[API] ← ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} (${elapsed}ms)`);
    return response;
  },
  (error) => {
    const elapsed = Date.now() - ((error.config as any)?._startTime || Date.now());
    const status = error.response?.status || 'NETWORK_ERROR';
    console.error(`[API] ✗ ${status} ${error.config?.method?.toUpperCase()} ${error.config?.url} (${elapsed}ms)`, error.message);
    if (error.response?.status === 401) {
      console.warn('[API] 401 Unauthorized — logging out user');
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
