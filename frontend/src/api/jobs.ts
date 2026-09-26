import { apiClient } from './client';
import type { JobListingResponse, PageResponse, SavedJobResponse } from '../types/api';

export const jobsApi = {
  search: (params: {
    keyword?: string;
    location?: string;
    platform?: string;
    sort?: string;
    page?: number;
    size?: number;
  }) => apiClient.get<PageResponse<JobListingResponse>>('/jobs', { params }).then((r) => r.data),
  platforms: () => apiClient.get<string[]>('/jobs/platforms').then((r) => r.data),
  save: (id: string) => apiClient.post<SavedJobResponse>(`/jobs/${id}/save`).then((r) => r.data),
  unsave: (id: string) => apiClient.delete(`/jobs/${id}/save`),
  markApplied: (id: string, applied: boolean, notes?: string) =>
    apiClient.put<SavedJobResponse>(`/jobs/${id}/mark-applied`, { applied, notes }).then((r) => r.data),
  refresh: () => apiClient.post<{ fetched: number }>('/jobs/refresh').then((r) => r.data),
};
