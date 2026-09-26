import { apiClient } from './client';
import type { ResumeResponse } from '../types/api';

export const resumeApi = {
  list: () => apiClient.get<ResumeResponse[]>('/resumes').then((r) => r.data),
  upload: (file: File, label?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (label) form.append('label', label);
    return apiClient
      .post<ResumeResponse>('/resumes', form)
      .then((r) => r.data);
  },
  remove: (id: string) => apiClient.delete(`/resumes/${id}`),
};
