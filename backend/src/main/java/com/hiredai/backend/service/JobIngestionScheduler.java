package com.hiredai.backend.service;

import com.hiredai.backend.adapter.JobSourceAdapter;
import com.hiredai.backend.entity.JobListing;
import com.hiredai.backend.repository.JobListingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

/**
 * Periodically pulls listings from each registered public job-source adapter and
 * upserts them into the shared JobListing table. Fetching is unauthenticated and
 * platform-agnostic across all users; per-user "enabled platforms" only filters what's
 * shown in a given user's feed (see JobListingService), not what gets fetched.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JobIngestionScheduler {

    private final List<JobSourceAdapter> adapters;
    private final JobListingRepository jobListingRepository;
    private final CustomFeedIngestionService customFeedIngestionService;

    @Scheduled(fixedRateString = "${app.ingestion.interval-ms:3600000}")
    public void ingestAll() {
        ingestFromAllAdapters();
    }

    /** Synchronous, on-demand refresh across all adapters (used by the manual "Refresh" action). */
    public int ingestFromAllAdapters() {
        var criteria = new JobSourceAdapter.SearchCriteria(List.of(), List.of(), null, null);
        int fromAdapters = adapters.stream().mapToInt(adapter -> ingestFromAdapter(adapter, criteria)).sum();
        return fromAdapters + customFeedIngestionService.ingestAll();
    }

    private int ingestFromAdapter(JobSourceAdapter adapter, JobSourceAdapter.SearchCriteria criteria) {
        try {
            List<JobSourceAdapter.JobListingData> results = adapter.fetchJobs(criteria);
            results.forEach(result -> upsert(adapter.getPlatformName(), result));
            log.info("Ingested {} listings from {}", results.size(), adapter.getPlatformName());
            return results.size();
        } catch (Exception e) {
            log.warn("Job ingestion failed for platform {}: {}", adapter.getPlatformName(), e.getMessage());
            return 0;
        }
    }

    private void upsert(String platformName, JobSourceAdapter.JobListingData result) {
        JobListing listing = jobListingRepository.findByPlatformAndExternalJobId(platformName, result.externalJobId())
                .orElseGet(JobListing::new);

        listing.setPlatform(platformName);
        listing.setExternalJobId(result.externalJobId());
        listing.setTitle(result.title());
        listing.setCompany(result.company());
        listing.setLocation(result.location());
        listing.setDescription(result.description());
        listing.setSalaryRange(result.salaryRange());
        listing.setSourceUrl(result.sourceUrl());
        if (listing.getPostedAt() == null) {
            listing.setPostedAt(result.postedAt() != null ? result.postedAt() : Instant.now());
        }
        listing.setFetchedAt(Instant.now());

        jobListingRepository.save(listing);
    }
}
