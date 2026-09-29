package com.hiredai.backend.service;

import com.hiredai.backend.adapter.JobSourceAdapter;
import com.hiredai.backend.entity.JobListing;
import com.hiredai.backend.repository.JobListingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Pulls listings from public job-source adapters and custom feeds on demand,
 * caching them directly in JobFeedCacheService in memory.
 * Eliminates continuous DB write storms to PostgreSQL while keeping feeds fresh.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JobIngestionScheduler {

    private final List<JobSourceAdapter> adapters;
    private final JobListingRepository jobListingRepository;
    private final CustomFeedIngestionService customFeedIngestionService;
    private final JobListingService jobListingService;
    private final JobFeedCacheService jobFeedCacheService;

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

    /**
     * Non-blocking background trigger for manual refresh requests:
     * Immediately returns to client while updating in-memory cache asynchronously.
     */
    public void triggerAsyncIngestion() {
        log.info("[Async] triggerAsyncIngestion called, current in-memory cache size={}", jobFeedCacheService.size());
        CompletableFuture.runAsync(() -> {
            if (isIngesting.compareAndSet(false, true)) {
                try {
                    long start = System.currentTimeMillis();
                    log.info("[Async] Starting background async job cache refresh sweep across all platforms");
                    int total = ingestFromAllAdapters();
                    jobListingService.invalidateCache();
                    long elapsed = System.currentTimeMillis() - start;
                    log.info("[Async] Completed background cache refresh: {} listings cached in {}ms (total in-memory={})",
                            total, elapsed, jobFeedCacheService.size());
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

    /** Parallel ingestion across all adapters, saving directly to in-memory cache. */
    public int ingestFromAllAdapters() {
        log.debug("[Ingest] Running parallel ingestion across {} built-in adapters + custom feeds", adapters.size());
        var criteria = new JobSourceAdapter.SearchCriteria(List.of(), List.of(), null, null);
        int fromAdapters = adapters.parallelStream()
                .mapToInt(adapter -> ingestFromAdapter(adapter, criteria))
                .sum();
        long customStart = System.currentTimeMillis();
        int fromCustom = customFeedIngestionService.ingestAll();
        long customElapsed = System.currentTimeMillis() - customStart;
        log.info("[Ingest] Adapters produced {} listings, custom feeds produced {} listings (custom took {}ms)",
                fromAdapters, fromCustom, customElapsed);
        return fromAdapters + fromCustom;
    }

    private int ingestFromAdapter(JobSourceAdapter adapter, JobSourceAdapter.SearchCriteria criteria) {
        String platform = adapter.getPlatformName();
        try {
            long fetchStart = System.currentTimeMillis();
            List<JobSourceAdapter.JobListingData> results = adapter.fetchJobs(criteria);
            long fetchElapsed = System.currentTimeMillis() - fetchStart;
            if (results == null || results.isEmpty()) {
                log.info("[Adapter] {} returned 0 listings in {}ms", platform, fetchElapsed);
                return 0;
            }
            jobFeedCacheService.putListingData(platform, results);
            log.info("[Adapter] {} returned and cached {} listings in {}ms", platform, results.size(), fetchElapsed);
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
    }
}
