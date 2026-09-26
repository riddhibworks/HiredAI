export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
}

export interface ResumeResponse {
  id: string;
  label: string;
  fileUrl: string;
  parsedJson: string;
  isDefault: boolean;
  uploadedAt: string;
}

export interface JobListingResponse {
  id: string;
  platform: string;
  externalJobId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salaryRange?: string;
  matchScore?: number;
  postedAt?: string;
  sourceUrl: string;
  saved: boolean;
  appliedManually: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface SavedJobResponse {
  id: string;
  jobListingId: string;
  savedAt: string;
  appliedManually: boolean;
  notes?: string;
  title?: string;
  company?: string;
  location?: string;
  platform?: string;
  salaryRange?: string;
  sourceUrl?: string;
  postedAt?: string;
}

export type JobSourceType = 'RSS' | 'JSON_API';

export interface BuiltInJobSourceResponse {
  name: string;
  active: boolean;
}

export interface JobSourceResponse {
  id: string;
  name: string;
  feedUrl: string;
  sourceType: JobSourceType;
  listPath?: string;
  titlePath?: string;
  companyPath?: string;
  locationPath?: string;
  descriptionPath?: string;
  urlPath?: string;
  externalIdPath?: string;
  postedAtPath?: string;
  enabled: boolean;
  ownedByCurrentUser: boolean;
  createdAt: string;
}

export interface JobSourceRequest {
  name: string;
  feedUrl: string;
  sourceType: JobSourceType;
  listPath?: string;
  titlePath?: string;
  companyPath?: string;
  locationPath?: string;
  descriptionPath?: string;
  urlPath?: string;
  externalIdPath?: string;
  postedAtPath?: string;
}

export interface ParsedJobPreview {
  externalId: string;
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  sourceUrl?: string;
  postedAt?: string;
}
