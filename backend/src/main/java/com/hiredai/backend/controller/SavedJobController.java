package com.hiredai.backend.controller;

import com.hiredai.backend.dto.savedjob.MarkAppliedRequest;
import com.hiredai.backend.dto.savedjob.SavedJobResponse;
import com.hiredai.backend.security.CurrentUserProvider;
import com.hiredai.backend.service.SavedJobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/saved-jobs")
@RequiredArgsConstructor
@Tag(name = "Saved Jobs", description = "Endpoints for viewing and managing user saved jobs dashboard")
public class SavedJobController {

    private final SavedJobService savedJobService;
    private final CurrentUserProvider currentUserProvider;

    @Operation(summary = "List all saved jobs for current user")
    @GetMapping
    public ResponseEntity<List<SavedJobResponse>> list() {
        return ResponseEntity.ok(savedJobService.listForUser(currentUserProvider.getUserId()));
    }

    @Operation(summary = "Save a job listing for current user")
    @PostMapping("/{jobListingId}")
    public ResponseEntity<SavedJobResponse> save(@PathVariable String jobListingId) {
        return ResponseEntity.ok(savedJobService.save(currentUserProvider.getUserId(), jobListingId));
    }

    @Operation(summary = "Remove a saved job listing for current user")
    @DeleteMapping("/{jobListingId}")
    public ResponseEntity<Void> unsave(@PathVariable String jobListingId) {
        savedJobService.unsave(currentUserProvider.getUserId(), jobListingId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Mark a saved job as applied with notes")
    @PutMapping("/{jobListingId}/mark-applied")
    public ResponseEntity<SavedJobResponse> markApplied(
            @PathVariable String jobListingId,
            @RequestBody(required = false) MarkAppliedRequest request) {
        boolean applied = request != null && request.applied();
        String notes = request != null ? request.notes() : null;
        return ResponseEntity.ok(savedJobService.markApplied(currentUserProvider.getUserId(), jobListingId, applied, notes));
    }
}

