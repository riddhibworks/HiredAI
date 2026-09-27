import { create } from 'zustand';
import type { JobListingResponse, SavedJobResponse } from '../types/api';

interface JobStoreState {
  // Job Feed cache
  feedJobs: JobListingResponse[];
  feedTotal: number;
  feedPage: number;
  feedQueryKey: string;
  feedLoadedAt: number;
  platforms: string[];

  // Saved / Applied jobs cache
  savedJobs: SavedJobResponse[];
  savedJobsLoadedAt: number;

  // Actions
  setFeed: (jobs: JobListingResponse[], total: number, page: number, queryKey: string) => void;
  appendFeed: (moreJobs: JobListingResponse[], total: number, page: number) => void;
  setPlatforms: (platforms: string[]) => void;
  setSavedJobs: (savedJobs: SavedJobResponse[]) => void;

  // Optimistic update actions that synchronize across pages
  toggleJobSaved: (jobId: string, saved: boolean, jobDetails?: Partial<JobListingResponse>) => void;
  toggleJobApplied: (jobId: string, applied: boolean) => void;
}

export const useJobStore = create<JobStoreState>((set) => ({
  feedJobs: [],
  feedTotal: 0,
  feedPage: 0,
  feedQueryKey: '',
  feedLoadedAt: 0,
  platforms: [],

  savedJobs: [],
  savedJobsLoadedAt: 0,

  setFeed: (jobs, total, page, queryKey) =>
    set({
      feedJobs: jobs,
      feedTotal: total,
      feedPage: page,
      feedQueryKey: queryKey,
      feedLoadedAt: Date.now(),
    }),

  appendFeed: (moreJobs, total, page) =>
    set((state) => ({
      feedJobs: [...state.feedJobs, ...moreJobs],
      feedTotal: total,
      feedPage: page,
      feedLoadedAt: Date.now(),
    })),

  setPlatforms: (platforms) => set({ platforms }),

  setSavedJobs: (savedJobs) =>
    set({
      savedJobs,
      savedJobsLoadedAt: Date.now(),
    }),

  toggleJobSaved: (jobId, saved, jobDetails) =>
    set((state) => {
      // 1. Update feed list
      const updatedFeed = state.feedJobs.map((j) =>
        j.id === jobId ? { ...j, saved } : j
      );

      // 2. Update saved list
      let updatedSaved = [...state.savedJobs];
      if (saved) {
        const alreadyExists = updatedSaved.some((s) => s.jobListingId === jobId || s.id === jobId);
        if (!alreadyExists) {
          const feedItem = state.feedJobs.find((j) => j.id === jobId);
          const title = jobDetails?.title ?? feedItem?.title;
          const company = jobDetails?.company ?? feedItem?.company;
          const location = jobDetails?.location ?? feedItem?.location;
          const platform = jobDetails?.platform ?? feedItem?.platform;
          const salaryRange = jobDetails?.salaryRange ?? feedItem?.salaryRange;
          const sourceUrl = jobDetails?.sourceUrl ?? feedItem?.sourceUrl;
          const postedAt = jobDetails?.postedAt ?? feedItem?.postedAt;

          updatedSaved.unshift({
            id: 'temp-' + jobId,
            jobListingId: jobId,
            savedAt: new Date().toISOString(),
            appliedManually: false,
            title,
            company,
            location,
            platform,
            salaryRange,
            sourceUrl,
            postedAt,
          });
        }
      } else {
        updatedSaved = updatedSaved.filter(
          (s) => s.jobListingId !== jobId && s.id !== jobId
        );
      }

      return { feedJobs: updatedFeed, savedJobs: updatedSaved };
    }),

  toggleJobApplied: (jobId, applied) =>
    set((state) => {
      // 1. Update feed list
      const updatedFeed = state.feedJobs.map((j) =>
        j.id === jobId
          ? { ...j, appliedManually: applied, saved: applied ? true : j.saved }
          : j
      );

      // 2. Update saved list
      let updatedSaved = state.savedJobs.map((s) =>
        s.jobListingId === jobId || s.id === jobId
          ? { ...s, appliedManually: applied }
          : s
      );

      // If marked applied and wasn't in saved list, add it
      if (applied && !updatedSaved.some((s) => s.jobListingId === jobId || s.id === jobId)) {
        const feedItem = state.feedJobs.find((j) => j.id === jobId);
        if (feedItem) {
          updatedSaved.unshift({
            id: 'temp-' + jobId,
            jobListingId: jobId,
            savedAt: new Date().toISOString(),
            appliedManually: true,
            title: feedItem.title,
            company: feedItem.company,
            location: feedItem.location,
            platform: feedItem.platform,
            salaryRange: feedItem.salaryRange,
            sourceUrl: feedItem.sourceUrl,
            postedAt: feedItem.postedAt,
          });
        }
      }

      return { feedJobs: updatedFeed, savedJobs: updatedSaved };
    }),
}));
