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

    @Scheduled(fixedRateString = "${app.ingestion.interval-ms:300000}", initialDelay = 5000)
    public void ingestAll() {
        log.info("Starting scheduled 5-minute job ingestion sweep across all adapters");
        ingestFromAllAdapters();
    }

    /** Parallel, on-demand refresh across all adapters with batch DB persistence. */
    public int ingestFromAllAdapters() {
        var criteria = new JobSourceAdapter.SearchCriteria(List.of(), List.of(), null, null);
        int fromAdapters = adapters.parallelStream()
                .mapToInt(adapter -> ingestFromAdapter(adapter, criteria))
                .sum();
        return fromAdapters + customFeedIngestionService.ingestAll();
    }

    private int ingestFromAdapter(JobSourceAdapter adapter, JobSourceAdapter.SearchCriteria criteria) {
        try {
            List<JobSourceAdapter.JobListingData> results = adapter.fetchJobs(criteria);
            if (results == null || results.isEmpty()) {
                return 0;
            }
            batchUpsert(adapter.getPlatformName(), results);
            log.info("Ingested {} listings from {}", results.size(), adapter.getPlatformName());
            return results.size();
        } catch (Exception e) {
            log.warn("Job ingestion failed for platform {}: {}", adapter.getPlatformName(), e.getMessage());
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
