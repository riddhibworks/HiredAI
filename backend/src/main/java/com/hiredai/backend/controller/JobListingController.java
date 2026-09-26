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
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@Tag(name = "Job Listings", description = "Endpoints for searching, saving, and managing job listings")
public class JobListingController {

    private final JobListingService jobListingService;
    private final SavedJobService savedJobService;
    private final JobIngestionScheduler jobIngestionScheduler;
    private final CurrentUserProvider currentUserProvider;
    private final JobSourceRepository jobSourceRepository;
    private final List<JobSourceAdapter> adapters;

    /** The public job sources this deployment can pull from; drives the source filter dropdown. */
    @Operation(summary = "Get list of available platform names")
    @GetMapping("/platforms")
    public ResponseEntity<List<String>> platforms() {
        List<String> names = new java.util.ArrayList<>(adapters.stream().map(JobSourceAdapter::getPlatformName).toList());
        jobSourceRepository.findByEnabledTrue().forEach(source -> names.add(source.getName()));
        return ResponseEntity.ok(names.stream().distinct().sorted().toList());
    }

    @Operation(summary = "Search job listings with filters and pagination")
    @GetMapping
    public ResponseEntity<Page<JobListingResponse>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String platform,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        var results = jobListingService.search(currentUserProvider.getUserId(), keyword, location, platform, sort, page, size);
        return ResponseEntity.ok(results);
    }

    @Operation(summary = "Get detailed information for a specific job listing")
    @GetMapping("/{id}")
    public ResponseEntity<JobListingResponse> get(@PathVariable String id) {
        return ResponseEntity.ok(jobListingService.getOrThrow(currentUserProvider.getUserId(), id));
    }

    @Operation(summary = "Save a job listing for current user")
    @PostMapping("/{id}/save")
    public ResponseEntity<SavedJobResponse> save(@PathVariable String id) {
        return ResponseEntity.ok(savedJobService.save(currentUserProvider.getUserId(), id));
    }

    @Operation(summary = "Unsave a job listing for current user")
    @DeleteMapping("/{id}/save")
    public ResponseEntity<Void> unsave(@PathVariable String id) {
        savedJobService.unsave(currentUserProvider.getUserId(), id);
        return ResponseEntity.noContent().build();
    }

    /** Personal tracker toggle only — never talks to the source platform. */
    @Operation(summary = "Mark a saved job as applied with notes")
    @PutMapping("/{id}/mark-applied")
    public ResponseEntity<SavedJobResponse> markApplied(@PathVariable String id, @RequestBody MarkAppliedRequest request) {
        return ResponseEntity.ok(savedJobService.markApplied(currentUserProvider.getUserId(), id, request.applied(), request.notes()));
    }

    /** On-demand refresh across all public job-source adapters, rather than waiting for the scheduled sweep. */
    @Operation(summary = "Trigger on-demand job ingestion from all adapters")
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Integer>> refresh() {
        int fetched = jobIngestionScheduler.ingestFromAllAdapters();
        return ResponseEntity.ok(Map.of("fetched", fetched));
    }
}

