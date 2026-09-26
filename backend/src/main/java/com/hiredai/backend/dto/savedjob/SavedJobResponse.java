package com.hiredai.backend.dto.savedjob;

import com.hiredai.backend.entity.JobListing;
import com.hiredai.backend.entity.SavedJob;

import java.time.Instant;

public record SavedJobResponse(
        String id,
        String jobListingId,
        Instant savedAt,
        boolean appliedManually,
        String notes,
        String title,
        String company,
        String location,
        String platform,
        String salaryRange,
        String sourceUrl,
        Instant postedAt
) {
    /** listing may be null if the original job listing has since been removed from the feed. */
    public static SavedJobResponse from(SavedJob s, JobListing listing) {
        return new SavedJobResponse(s.getId(), s.getJobListingId(), s.getSavedAt(), s.isAppliedManually(), s.getNotes(),
                listing != null ? listing.getTitle() : null,
                listing != null ? listing.getCompany() : null,
                listing != null ? listing.getLocation() : null,
                listing != null ? listing.getPlatform() : null,
                listing != null ? listing.getSalaryRange() : null,
                listing != null ? listing.getSourceUrl() : null,
                listing != null ? listing.getPostedAt() : null);
    }
}
