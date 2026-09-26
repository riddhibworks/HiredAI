package com.hiredai.backend.dto.resume;

import com.hiredai.backend.entity.Resume;

import java.time.Instant;

public record ResumeResponse(
        String id,
        String label,
        String fileUrl,
        String parsedJson,
        boolean isDefault,
        Instant uploadedAt
) {
    public static ResumeResponse from(Resume r) {
        return new ResumeResponse(r.getId(), r.getLabel(), r.getFileUrl(), r.getParsedJson(), r.isDefault(), r.getUploadedAt());
    }
}
