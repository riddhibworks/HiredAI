package com.hiredai.backend.service;

import com.hiredai.backend.adapter.JobSourceAdapter;
import com.hiredai.backend.entity.JobListing;
import com.hiredai.backend.repository.JobListingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Periodically pulls listings from each registered public job-source adapter and
 * upserts them into the shared JobListing table. Runs automatically on a 5-minute
 * interval to keep job feeds continuously updated.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JobIngestionScheduler {

    private final List<JobSourceAdapter> adapters;
    private final JobListingRepository jobListingRepository;
    private final CustomFeedIngestionService customFeedIngestionService;
    private final JobListingService jobListingService;

    private final AtomicBoolean isIngesting = new AtomicBoolean(false);

    @jakarta.annotation.PostConstruct
    @Transactional
    public void cleanupLegacyPlatforms() {
        try {
            jobListingRepository.deleteByPlatform("Google Jobs");
            jobListingService.invalidateCache();
            log.info("Cleaned up any legacy Google Jobs listings from database");
        } catch (Exception e) {
            log.warn("Could not clean up legacy Google Jobs entries: {}", e.getMessage());
        }
    }

    @Scheduled(fixedRateString = "${app.ingestion.interval-ms:300000}", initialDelay = 5000)
    public void ingestAll() {
        long start = System.currentTimeMillis();
        log.info("[Scheduler] Starting scheduled 5-minute job ingestion sweep across {} adapters", adapters.size());
        int total = ingestFromAllAdapters();
        jobListingService.invalidateCache();
        long elapsed = System.currentTimeMillis() - start;
        log.info("[Scheduler] Completed scheduled ingestion: {} total listings upserted in {}ms", total, elapsed);
    }

    /**
     * Non-blocking background trigger:
     * - If database has 0 listings, immediately ingests a fast batch of 20 listings so initial feed is populated.
     * - Runs the remaining platforms in the background without holding up the HTTP response thread.
     */
    public void triggerAsyncIngestion() {
        log.info("[Async] triggerAsyncIngestion called, current listing count={}", jobListingRepository.count());
        if (jobListingRepository.count() == 0) {
            log.info("[Async] Database empty — running synchronous initial batch");
            ensureInitialBatch();
        }

        CompletableFuture.runAsync(() -> {
            if (isIngesting.compareAndSet(false, true)) {
                try {
                    long start = System.currentTimeMillis();
                    log.info("[Async] Starting background async job ingestion sweep across all platforms");
                    int total = ingestFromAllAdapters();
                    jobListingService.invalidateCache();
                    long elapsed = System.currentTimeMillis() - start;
                    log.info("[Async] Completed background ingestion: {} total listings in {}ms", total, elapsed);
                } catch (Exception e) {
                    log.error("[Async] Async job ingestion failed: {}", e.getMessage(), e);
                } finally {
                    isIngesting.set(false);
                }
            } else {
                log.info("[Async] Job ingestion already in progress in background, skipping duplicate run.");
            }
        });
    }

    private void ensureInitialBatch() {
        long start = System.currentTimeMillis();
        log.info("[InitBatch] Populating initial batch of >=20 listings");
        var criteria = new JobSourceAdapter.SearchCriteria(List.of(), List.of(), null, null);
        int totalFetched = 0;
        for (JobSourceAdapter adapter : adapters) {
            try {
                int fetched = ingestFromAdapter(adapter, criteria);
                totalFetched += fetched;
                if (totalFetched >= 20) {
                    log.info("[InitBatch] Reached {} listings from {} — initial batch complete", totalFetched, adapter.getPlatformName());
                    break;
                }
            } catch (Exception e) {
                log.debug("[InitBatch] Adapter {} failed during initial batch: {}", adapter.getPlatformName(), e.getMessage());
            }
        }
        jobListingService.invalidateCache();
        long elapsed = System.currentTimeMillis() - start;
        log.info("[InitBatch] Initial batch complete: {} listings in {}ms", totalFetched, elapsed);
    }

    /** Parallel, on-demand refresh across all adapters with batch DB persistence. */
    public int ingestFromAllAdapters() {
        log.debug("[Ingest] Running parallel ingestion across {} built-in adapters + custom feeds", adapters.size());
        var criteria = new JobSourceAdapter.SearchCriteria(List.of(), List.of(), null, null);
        int fromAdapters = adapters.parallelStream()
                .mapToInt(adapter -> ingestFromAdapter(adapter, criteria))
                .sum();
        long customStart = System.currentTimeMillis();
        int fromCustom = customFeedIngestionService.ingestAll();
        long customElapsed = System.currentTimeMillis() - customStart;
        log.info("[Ingest] Adapters produced {} listings, custom feeds produced {} listings (custom took {}ms)", fromAdapters, fromCustom, customElapsed);
        return fromAdapters + fromCustom;
    }

    private int ingestFromAdapter(JobSourceAdapter adapter, JobSourceAdapter.SearchCriteria criteria) {
        String platform = adapter.getPlatformName();
        try {
            long fetchStart = System.currentTimeMillis();
            log.debug("[Adapter] Fetching jobs from {}", platform);
            List<JobSourceAdapter.JobListingData> results = adapter.fetchJobs(criteria);
            long fetchElapsed = System.currentTimeMillis() - fetchStart;
            if (results == null || results.isEmpty()) {
                log.info("[Adapter] {} returned 0 listings in {}ms", platform, fetchElapsed);
                return 0;
            }
            log.info("[Adapter] {} returned {} listings in {}ms — starting DB upsert", platform, results.size(), fetchElapsed);
            long upsertStart = System.currentTimeMillis();
            batchUpsert(platform, results);
            long upsertElapsed = System.currentTimeMillis() - upsertStart;
            log.info("[Adapter] {} — upserted {} listings into DB in {}ms (fetch={}ms, upsert={}ms, total={}ms)", platform, results.size(), upsertElapsed, fetchElapsed, upsertElapsed, fetchElapsed + upsertElapsed);
            return results.size();
        } catch (Exception e) {
            log.warn("[Adapter] Job ingestion failed for platform {}: {}", platform, e.getMessage());
            return 0;
        }
    }

    @Transactional
    public void batchUpsert(String platformName, List<JobSourceAdapter.JobListingData> results) {
        Set<String> externalIds = results.stream()
                .map(JobSourceAdapter.JobListingData::externalJobId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<String, JobListing> existingMap = jobListingRepository
                .findByPlatformAndExternalJobIdIn(platformName, externalIds)
                .stream()
                .collect(Collectors.toMap(JobListing::getExternalJobId, Function.identity(), (a, b) -> a));

        Map<String, JobListing> toSaveMap = new LinkedHashMap<>();
        Instant now = Instant.now();

        for (JobSourceAdapter.JobListingData result : results) {
            if (result.externalJobId() == null || result.externalJobId().isBlank()) {
                continue;
            }
            JobListing listing = toSaveMap.computeIfAbsent(result.externalJobId(), id ->
                    existingMap.getOrDefault(id, new JobListing()));

            listing.setPlatform(platformName);
            listing.setExternalJobId(result.externalJobId());
            listing.setTitle(result.title());
            listing.setCompany(result.company());
            listing.setLocation(result.location());
            listing.setDescription(result.description());
            listing.setSalaryRange(result.salaryRange());
            listing.setSourceUrl(result.sourceUrl());
            if (listing.getPostedAt() == null) {
                listing.setPostedAt(result.postedAt() != null ? result.postedAt() : now);
            }
            listing.setFetchedAt(now);
        }

        jobListingRepository.saveAll(toSaveMap.values());
        log.debug("[Upsert] Saved {} listings for platform {} ({} new, {} updated)",
                toSaveMap.size(), platformName,
                toSaveMap.size() - existingMap.size(),
                Math.min(existingMap.size(), toSaveMap.size()));
    }
}
