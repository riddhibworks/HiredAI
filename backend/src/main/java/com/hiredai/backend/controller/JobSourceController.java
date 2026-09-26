package com.hiredai.backend.controller;

import com.hiredai.backend.dto.jobsource.BuiltInJobSourceResponse;
import com.hiredai.backend.dto.jobsource.JobSourceRequest;
import com.hiredai.backend.dto.jobsource.JobSourceResponse;
import com.hiredai.backend.security.CurrentUserProvider;
import com.hiredai.backend.service.CustomFeedIngestionService;
import com.hiredai.backend.service.JobSourceService;
import com.hiredai.backend.adapter.JobSourceAdapter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/job-sources")
@RequiredArgsConstructor
@Tag(name = "Job Sources", description = "Endpoints for managing built-in and custom RSS/JSON job feeds")
public class JobSourceController {

    private final JobSourceService jobSourceService;
    private final CustomFeedIngestionService customFeedIngestionService;
    private final CurrentUserProvider currentUserProvider;
    private final List<JobSourceAdapter> builtInAdapters;

    /** Read-only list of the app's built-in platform adapters (Arbeitnow, RemoteOK, Adzuna, etc.) and whether
     * each is currently active — key-gated adapters show inactive until their API key env vars are configured. */
    @Operation(summary = "Get list of built-in platform adapters and status")
    @GetMapping("/built-in")
    public ResponseEntity<List<BuiltInJobSourceResponse>> listBuiltIn() {
        return ResponseEntity.ok(builtInAdapters.stream()
                .map(adapter -> new BuiltInJobSourceResponse(adapter.getPlatformName(), adapter.isConfigured()))
                .toList());
    }

    @Operation(summary = "List custom job sources configured by current user")
    @GetMapping
    public ResponseEntity<List<JobSourceResponse>> list() {
        return ResponseEntity.ok(jobSourceService.list(currentUserProvider.getUserId()));
    }

    @Operation(summary = "Create a new custom job source feed")
    @PostMapping
    public ResponseEntity<JobSourceResponse> create(@Valid @RequestBody JobSourceRequest request) {
        return ResponseEntity.ok(jobSourceService.create(currentUserProvider.getUserId(), request));
    }

    /** Fetches and parses a candidate source without saving it, so the UI can validate mappings first. */
    @Operation(summary = "Preview and test job feed parsing before saving")
    @PostMapping("/preview")
    public ResponseEntity<List<CustomFeedIngestionService.ParsedJob>> preview(@Valid @RequestBody JobSourceRequest request) {
        try {
            return ResponseEntity.ok(customFeedIngestionService.preview(request));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not fetch or parse this feed: " + e.getMessage());
        }
    }

    @Operation(summary = "Toggle active status of a custom job source")
    @PutMapping("/{id}/toggle")
    public ResponseEntity<JobSourceResponse> toggle(@PathVariable String id) {
        return ResponseEntity.ok(jobSourceService.toggle(currentUserProvider.getUserId(), id));
    }

    @Operation(summary = "Delete a custom job source")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        jobSourceService.delete(currentUserProvider.getUserId(), id);
        return ResponseEntity.noContent().build();
    }
}

