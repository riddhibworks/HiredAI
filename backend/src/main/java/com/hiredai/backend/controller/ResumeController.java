package com.hiredai.backend.controller;

import com.hiredai.backend.dto.resume.ResumeResponse;
import com.hiredai.backend.security.CurrentUserProvider;
import com.hiredai.backend.service.ResumeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
@Tag(name = "Resumes", description = "Endpoints for uploading, listing, and deleting user resumes")
public class ResumeController {

    private final ResumeService resumeService;
    private final CurrentUserProvider currentUserProvider;

    @Operation(summary = "Upload a resume PDF/DOCX file")
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ResumeResponse> upload(@RequestParam("file") MultipartFile file,
                                                  @RequestParam(value = "label", required = false) String label) {
        var resume = resumeService.upload(currentUserProvider.getUserId(), label, file);
        return ResponseEntity.ok(ResumeResponse.from(resume));
    }

    @Operation(summary = "List all resumes uploaded by current user")
    @GetMapping
    public ResponseEntity<List<ResumeResponse>> list() {
        var resumes = resumeService.listForUser(currentUserProvider.getUserId()).stream()
                .map(ResumeResponse::from)
                .toList();
        return ResponseEntity.ok(resumes);
    }

    @Operation(summary = "Delete an uploaded resume by ID")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        resumeService.delete(currentUserProvider.getUserId(), id);
        return ResponseEntity.noContent().build();
    }
}

