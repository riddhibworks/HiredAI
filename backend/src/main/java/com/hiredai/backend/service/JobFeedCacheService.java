package com.hiredai.backend.service;

import com.hiredai.backend.adapter.JobSourceAdapter;
import com.hiredai.backend.entity.JobListing;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Ultra-fast in-memory cache for all ingested public job listings.
 * Eliminates high-volume database write churn and row locking on Postgres,
 * enabling sub-millisecond filtering, searching, and instant feed refresh.
 * Persistent storage in PostgreSQL is reserved on-demand for saved/applied jobs.
 */
@Service
@Slf4j
public class JobFeedCacheService {

    private final Map<String, JobListing> cache = new ConcurrentHashMap<>();

    public static String generateId(String platform, String externalJobId) {
        if (externalJobId == null || externalJobId.isBlank()) {
            return UUID.randomUUID().toString();
        }
        return UUID.nameUUIDFromBytes((platform + ":" + externalJobId).getBytes(StandardCharsets.UTF_8)).toString();
    }

    public void initFromList(List<JobListing> listings) {
        if (listings == null || listings.isEmpty()) return;
        for (JobListing listing : listings) {
            String id = listing.getId();
            if (id == null || id.isBlank()) {
                id = generateId(listing.getPlatform(), listing.getExternalJobId());
                listing.setId(id);
            }
            cache.put(id, listing);
        }
        log.info("[FeedCache] Initialized in-memory cache with {} listings from DB", cache.size());
    }

    public void putListingData(String platformName, List<JobSourceAdapter.JobListingData> dataList) {
        if (dataList == null || dataList.isEmpty()) return;
        Instant now = Instant.now();
        int added = 0;
        int updated = 0;
        for (JobSourceAdapter.JobListingData data : dataList) {
            if (data.externalJobId() == null || data.externalJobId().isBlank()) {
                continue;
            }
            String id = generateId(platformName, data.externalJobId());
            JobListing existing = cache.get(id);
            if (existing == null) {
                JobListing listing = new JobListing();
                listing.setId(id);
                listing.setPlatform(platformName);
                listing.setExternalJobId(data.externalJobId());
                listing.setTitle(data.title());
                listing.setCompany(data.company());
                listing.setLocation(data.location());
                listing.setDescription(data.description());
                listing.setSalaryRange(data.salaryRange());
                listing.setSourceUrl(data.sourceUrl());
                listing.setPostedAt(data.postedAt() != null ? data.postedAt() : now);
                listing.setFetchedAt(now);
                cache.put(id, listing);
                added++;
            } else {
                existing.setTitle(data.title());
                existing.setCompany(data.company());
                existing.setLocation(data.location());
                existing.setDescription(data.description());
                existing.setSalaryRange(data.salaryRange());
                existing.setSourceUrl(data.sourceUrl());
                if (data.postedAt() != null) {
                    existing.setPostedAt(data.postedAt());
                }
                existing.setFetchedAt(now);
                updated++;
            }
        }
        log.info("[FeedCache] Cached {} listings for {} ({} new, {} updated | total in-memory={})",
                dataList.size(), platformName, added, updated, cache.size());
    }

    public void putListing(JobListing listing) {
        if (listing == null) return;
        if (listing.getId() == null || listing.getId().isBlank()) {
            listing.setId(generateId(listing.getPlatform(), listing.getExternalJobId()));
        }
        cache.put(listing.getId(), listing);
    }

    public Optional<JobListing> getById(String id) {
        if (id == null) return Optional.empty();
        return Optional.ofNullable(cache.get(id));
    }

    public List<JobListing> getAllListings() {
        return new ArrayList<>(cache.values());
    }

    public List<String> getAvailablePlatforms() {
        return cache.values().stream()
                .map(JobListing::getPlatform)
                .filter(Objects::nonNull)
                .filter(p -> !p.isBlank())
                .distinct()
                .sorted()
                .toList();
    }

    public int size() {
        return cache.size();
    }
}
