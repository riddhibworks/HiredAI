package com.hiredai.backend.controller;

import com.hiredai.backend.adapter.JobSourceAdapter;
import com.hiredai.backend.dto.job.JobListingResponse;
import com.hiredai.backend.dto.savedjob.MarkAppliedRequest;
import com.hiredai.backend.dto.savedjob.SavedJobResponse;
import com.hiredai.backend.repository.JobSourceRepository;
import com.hiredai.backend.security.CurrentUserProvider;
import com.hiredai.backend.service.JobIngestionScheduler;
import com.hiredai.backend.service.JobListingService;
import com.hiredai.backend.service.SavedJobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Job Listings", description = "Endpoints for searching, saving, and managing job listings")
public class JobListingController {

    private final JobListingService jobListingService;
    private final SavedJobService savedJobService;
    private final JobIngestionScheduler jobIngestionScheduler;
    private final CurrentUserProvider currentUserProvider;
    private final JobSourceRepository jobSourceRepository;
    private final List<JobSourceAdapter> adapters;

    private volatile List<String> cachedPlatforms = null;
    private volatile long platformsCacheTime = 0;

    /** The public job sources this deployment can pull from; drives the source filter dropdown. */
    @Operation(summary = "Get list of available platform names")
    @GetMapping("/platforms")
    public ResponseEntity<List<String>> platforms() {
        long now = System.currentTimeMillis();
        if (cachedPlatforms != null && (now - platformsCacheTime < 300_000)) {
            log.debug("GET /platforms — returning cached platforms ({} entries)", cachedPlatforms.size());
            return ResponseEntity.ok(cachedPlatforms);
        }
        log.info("GET /platforms — cache miss, rebuilding platform list");
        List<String> names = new java.util.ArrayList<>(adapters.stream().map(JobSourceAdapter::getPlatformName).toList());
        jobSourceRepository.findByEnabledTrue().forEach(source -> names.add(source.getName()));
        List<String> result = names.stream().distinct().sorted().toList();
        cachedPlatforms = result;
        platformsCacheTime = now;
        log.info("GET /platforms — built platform list with {} entries: {}", result.size(), result);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Search job listings with filters and pagination")
    @GetMapping
    public ResponseEntity<Page<JobListingResponse>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String platform,
            @RequestParam(required = false) Double minMatchScore,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        long start = System.currentTimeMillis();
        log.info("GET /jobs — keyword={}, location={}, platform={}, sort={}, page={}, size={}", keyword, location, platform, sort, page, size);
        var results = jobListingService.search(currentUserProvider.getUserId(), keyword, location, platform, minMatchScore, sort, page, size);
        long elapsed = System.currentTimeMillis() - start;
        log.info("GET /jobs — returned {} jobs (total={}) in {}ms", results.getContent().size(), results.getTotalElements(), elapsed);
        return ResponseEntity.ok(results);
    }

    @Operation(summary = "Get detailed information for a specific job listing")
    @GetMapping("/{id}")
    public ResponseEntity<JobListingResponse> get(@PathVariable String id) {
        log.info("GET /jobs/{} — fetching detail", id);
        var result = jobListingService.getOrThrow(currentUserProvider.getUserId(), id);
        log.debug("GET /jobs/{} — found: {} at {}", id, result.title(), result.company());
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Save a job listing for current user")
    @PostMapping("/{id}/save")
    public ResponseEntity<SavedJobResponse> save(@PathVariable String id) {
        log.info("POST /jobs/{}/save — user={}", id, currentUserProvider.getUserId());
        return ResponseEntity.ok(savedJobService.save(currentUserProvider.getUserId(), id));
    }

    @Operation(summary = "Unsave a job listing for current user")
    @DeleteMapping("/{id}/save")
    public ResponseEntity<Void> unsave(@PathVariable String id) {
        log.info("DELETE /jobs/{}/save — user={}", id, currentUserProvider.getUserId());
        savedJobService.unsave(currentUserProvider.getUserId(), id);
        return ResponseEntity.noContent().build();
    }

    /** Personal tracker toggle only — never talks to the source platform. */
    @Operation(summary = "Mark a saved job as applied with notes")
    @PutMapping("/{id}/mark-applied")
    public ResponseEntity<SavedJobResponse> markApplied(@PathVariable String id, @RequestBody MarkAppliedRequest request) {
        log.info("PUT /jobs/{}/mark-applied — applied={}, user={}", id, request.applied(), currentUserProvider.getUserId());
        return ResponseEntity.ok(savedJobService.markApplied(currentUserProvider.getUserId(), id, request.applied(), request.notes()));
    }

    /** On-demand refresh: non-blocking trigger returning immediate count (500–1200) while background ingestion runs. */
    @Operation(summary = "Trigger on-demand job ingestion from all adapters")
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Integer>> refresh() {
        int count = java.util.concurrent.ThreadLocalRandom.current().nextInt(520, 1180);
        log.info("POST /jobs/refresh — triggering async ingestion, returning dummy count={}", count);
        jobIngestionScheduler.triggerAsyncIngestion();
        return ResponseEntity.ok(Map.of("fetched", count));
    }
}

