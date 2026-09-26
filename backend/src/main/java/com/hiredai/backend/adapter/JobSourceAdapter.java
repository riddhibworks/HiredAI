package com.hiredai.backend.adapter;

import java.time.Instant;
import java.util.List;

/**
 * Adapter contract for a job source. Implementations must only use a platform's
 * official public API, RSS feed, or otherwise permitted access method — no scraping,
 * no login automation, no credential storage. Each adapter maps the source's raw
 * response into the common JobListingData shape.
 */
public interface JobSourceAdapter {

    String getPlatformName();

    List<JobListingData> fetchJobs(SearchCriteria criteria);

    /** False for adapters gated behind an unset API key — used to surface source status in the UI. */
    default boolean isConfigured() {
        return true;
    }

    record SearchCriteria(List<String> keywords, List<String> locations, String remoteType, String seniority) {}

    record JobListingData(String externalJobId, String title, String company, String location,
                           String description, String salaryRange, String sourceUrl, Instant postedAt) {}
}
