package com.hiredai.backend.dto.jobsource;

import com.hiredai.backend.entity.JobSource;
import com.hiredai.backend.entity.JobSourceType;

import java.time.Instant;

public record JobSourceResponse(
        String id,
        String name,
        String feedUrl,
        JobSourceType sourceType,
        String listPath,
        String titlePath,
        String companyPath,
        String locationPath,
        String descriptionPath,
        String urlPath,
        String externalIdPath,
        String postedAtPath,
        boolean enabled,
        boolean ownedByCurrentUser,
        Instant createdAt
) {
    public static JobSourceResponse from(JobSource source, String currentUserId) {
        return new JobSourceResponse(source.getId(), source.getName(), source.getFeedUrl(), source.getSourceType(),
                source.getListPath(), source.getTitlePath(), source.getCompanyPath(), source.getLocationPath(),
                source.getDescriptionPath(), source.getUrlPath(), source.getExternalIdPath(), source.getPostedAtPath(),
                source.isEnabled(), source.getAddedByUserId().equals(currentUserId), source.getCreatedAt());
    }
}
