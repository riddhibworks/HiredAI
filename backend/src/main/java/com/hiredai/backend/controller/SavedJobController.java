package com.hiredai.backend.controller;

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
@Tag(name = "Saved Jobs", description = "Endpoints for viewing user saved jobs dashboard")
public class SavedJobController {

    private final SavedJobService savedJobService;
    private final CurrentUserProvider currentUserProvider;

    @Operation(summary = "List all saved jobs for current user")
    @GetMapping
    public ResponseEntity<List<SavedJobResponse>> list() {
        return ResponseEntity.ok(savedJobService.listForUser(currentUserProvider.getUserId()));
    }
}

