import { apiClient } from './client';
import type { SavedJobResponse } from '../types/api';

export const savedJobsApi = {
  list: () => apiClient.get<SavedJobResponse[]>('/saved-jobs').then((r) => r.data),
  unsave: (jobListingId: string) => apiClient.delete(`/jobs/${jobListingId}/save`),
  markApplied: (jobListingId: string, applied: boolean, notes?: string) =>
    apiClient.put<SavedJobResponse>(`/jobs/${jobListingId}/mark-applied`, { applied, notes }).then((r) => r.data),
};
