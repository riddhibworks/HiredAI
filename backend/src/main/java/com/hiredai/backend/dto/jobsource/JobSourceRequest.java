package com.hiredai.backend.dto.jobsource;

import com.hiredai.backend.entity.JobSourceType;
import jakarta.validation.constraints.NotBlank;

public record JobSourceRequest(
        @NotBlank String name,
        @NotBlank String feedUrl,
        JobSourceType sourceType,
        // Only used when sourceType is JSON_API: dot-paths into each job object, e.g. "data.jobs" / "title".
        String listPath,
        String titlePath,
        String companyPath,
        String locationPath,
        String descriptionPath,
        String urlPath,
        String externalIdPath,
        String postedAtPath
) {
    public JobSourceType sourceTypeOrDefault() {
        return sourceType != null ? sourceType : JobSourceType.RSS;
    }
}
