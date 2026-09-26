package com.hiredai.backend.dto.job;

import com.hiredai.backend.entity.JobListing;

import java.time.Instant;

public record JobListingResponse(
        String id,
        String platform,
        String externalJobId,
        String title,
        String company,
        String location,
        String description,
        String salaryRange,
        Double matchScore,
        Instant postedAt,
        String sourceUrl,
        boolean saved,
        boolean appliedManually
) {
    public static JobListingResponse from(JobListing j) {
        return from(j, false, false);
    }

    public static JobListingResponse from(JobListing j, boolean saved, boolean appliedManually) {
        return new JobListingResponse(j.getId(), j.getPlatform(), j.getExternalJobId(), j.getTitle(), j.getCompany(),
                j.getLocation(), j.getDescription(), j.getSalaryRange(), j.getMatchScore(), j.getPostedAt(),
                j.getSourceUrl(), saved, appliedManually);
    }
}
