import { apiClient } from './client';
import type { BuiltInJobSourceResponse, JobSourceRequest, JobSourceResponse, ParsedJobPreview } from '../types/api';

export const jobSourcesApi = {
  list: () => apiClient.get<JobSourceResponse[]>('/job-sources').then((r) => r.data),
  listBuiltIn: () => apiClient.get<BuiltInJobSourceResponse[]>('/job-sources/built-in').then((r) => r.data),
  create: (data: JobSourceRequest) => apiClient.post<JobSourceResponse>('/job-sources', data).then((r) => r.data),
  preview: (data: JobSourceRequest) =>
    apiClient.post<ParsedJobPreview[]>('/job-sources/preview', data).then((r) => r.data),
  toggle: (id: string) => apiClient.put<JobSourceResponse>(`/job-sources/${id}/toggle`).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/job-sources/${id}`),
};
