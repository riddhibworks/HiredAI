package com.hiredai.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hiredai.backend.adapter.JobSourceAdapter;
import com.hiredai.backend.entity.JobListing;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Two-tier caching service for job listings:
 * - L1: High-speed in-memory ConcurrentHashMap in JVM heap (< 0.05ms latency).
 * - L2: Shared Redis Hash cache (key: 'hiredai:jobs') persisting listings across restarts/deployments.
 * Gracefully degrades to pure in-memory mode if Redis is temporarily unreachable.
 */
@Service
@Slf4j
public class JobFeedCacheService {

    public static final String REDIS_JOBS_KEY = "hiredai:jobs";

    private final Map<String, JobListing> localCache = new ConcurrentHashMap<>();
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper redisObjectMapper;

    public JobFeedCacheService(
            @Autowired(required = false) StringRedisTemplate redisTemplate,
            @Autowired(required = false) @Qualifier("redisObjectMapper") ObjectMapper redisObjectMapper) {
        this.redisTemplate = redisTemplate;
        this.redisObjectMapper = redisObjectMapper != null ? redisObjectMapper : new ObjectMapper();
    }

    @PostConstruct
    public void initFromRedis() {
        if (redisTemplate == null) {
            log.info("[FeedCache] RedisTemplate not configured, running in pure in-memory mode");
            return;
        }
        try {
            long start = System.currentTimeMillis();
            Map<Object, Object> entries = redisTemplate.opsForHash().entries(REDIS_JOBS_KEY);
            if (entries != null && !entries.isEmpty()) {
                int loaded = 0;
                for (Map.Entry<Object, Object> entry : entries.entrySet()) {
                    try {
                        String json = (String) entry.getValue();
                        JobListing listing = redisObjectMapper.readValue(json, JobListing.class);
                        localCache.put(listing.getId(), listing);
                        loaded++;
                    } catch (Exception e) {
                        log.debug("[FeedCache] Failed to deserialize listing: {}", e.getMessage());
                    }
                }
                log.info("[FeedCache] Loaded {} job listings from Redis key '{}' in {}ms",
                        loaded, REDIS_JOBS_KEY, System.currentTimeMillis() - start);
            } else {
                log.info("[FeedCache] Redis cache key '{}' is currently empty", REDIS_JOBS_KEY);
            }
        } catch (Exception e) {
            log.warn("[FeedCache] Could not load listings from Redis at startup (falling back to memory): {}", e.getMessage());
        }
    }

    public static String generateId(String platform, String externalJobId) {
        if (externalJobId == null || externalJobId.isBlank()) {
            return UUID.randomUUID().toString();
        }
        return UUID.nameUUIDFromBytes((platform + ":" + externalJobId).getBytes(StandardCharsets.UTF_8)).toString();
    }

    public void initFromList(List<JobListing> listings) {
        if (listings == null || listings.isEmpty()) return;
        List<JobListing> toSync = new ArrayList<>();
        for (JobListing listing : listings) {
            String originalId = listing.getId();
            String deterministicId = generateId(listing.getPlatform(), listing.getExternalJobId());
            listing.setId(deterministicId);
            localCache.put(deterministicId, listing);
            if (originalId != null && !originalId.isBlank() && !originalId.equals(deterministicId)) {
                // Also index by legacy ID so any old saved_jobs foreign references still resolve
                localCache.put(originalId, listing);
            }
            toSync.add(listing);
        }
        log.info("[FeedCache] Initialized local cache with {} listings (total={})", listings.size(), localCache.size());
        syncToRedis(toSync);
    }

    public void putListingData(String platformName, List<JobSourceAdapter.JobListingData> dataList) {
        if (dataList == null || dataList.isEmpty()) return;
        Instant now = Instant.now();
        int added = 0;
        int updated = 0;
        List<JobListing> updatedListings = new ArrayList<>();

        for (JobSourceAdapter.JobListingData data : dataList) {
            if (data.externalJobId() == null || data.externalJobId().isBlank()) {
                continue;
            }
            String id = generateId(platformName, data.externalJobId());
            JobListing existing = localCache.get(id);
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
                localCache.put(id, listing);
                updatedListings.add(listing);
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
                updatedListings.add(existing);
                updated++;
            }
        }
        log.info("[FeedCache] Cached {} listings for {} ({} new, {} updated | total in-memory={})",
                dataList.size(), platformName, added, updated, localCache.size());
        syncToRedis(updatedListings);
    }

    public void putListing(JobListing listing) {
        if (listing == null) return;
        if (listing.getId() == null || listing.getId().isBlank()) {
            listing.setId(generateId(listing.getPlatform(), listing.getExternalJobId()));
        }
        localCache.put(listing.getId(), listing);
        syncToRedis(List.of(listing));
    }

    private void syncToRedis(List<JobListing> listings) {
        if (redisTemplate == null || listings == null || listings.isEmpty()) return;
        CompletableFuture.runAsync(() -> {
            try {
                int batchSize = 25;
                int totalSynced = 0;
                for (int i = 0; i < listings.size(); i += batchSize) {
                    List<JobListing> chunk = listings.subList(i, Math.min(i + batchSize, listings.size()));
                    Map<String, String> map = new HashMap<>(chunk.size());
                    for (JobListing l : chunk) {
                        try {
                            map.put(l.getId(), redisObjectMapper.writeValueAsString(l));
                        } catch (Exception e) {
                            log.debug("Serialization error for listing {}: {}", l.getId(), e.getMessage());
                        }
                    }
                    if (!map.isEmpty()) {
                        redisTemplate.opsForHash().putAll(REDIS_JOBS_KEY, map);
                        totalSynced += map.size();
                    }
                }
                redisTemplate.expire(REDIS_JOBS_KEY, Duration.ofDays(7));
                log.info("[FeedCache] Synced {} listings to Redis key '{}'", totalSynced, REDIS_JOBS_KEY);
            } catch (Exception e) {
                log.warn("[FeedCache] Failed to sync to Redis: {}", e.getMessage());
            }
        });
    }

    public Optional<JobListing> getById(String id) {
        if (id == null) return Optional.empty();
        JobListing found = localCache.get(id);
        if (found != null) {
            return Optional.of(found);
        }
        if (redisTemplate != null) {
            try {
                Object val = redisTemplate.opsForHash().get(REDIS_JOBS_KEY, id);
                if (val != null) {
                    JobListing listing = redisObjectMapper.readValue((String) val, JobListing.class);
                    localCache.put(listing.getId(), listing);
                    return Optional.of(listing);
                }
            } catch (Exception e) {
                log.debug("[FeedCache] Redis lookup failed for id {}: {}", id, e.getMessage());
            }
        }
        return Optional.empty();
    }

    public List<JobListing> getAllListings() {
        return new ArrayList<>(localCache.values());
    }

    public List<String> getAvailablePlatforms() {
        return localCache.values().stream()
                .map(JobListing::getPlatform)
                .filter(Objects::nonNull)
                .filter(p -> !p.isBlank())
                .distinct()
                .sorted()
                .toList();
    }

    public int size() {
        return localCache.size();
    }
}
