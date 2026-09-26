package com.hiredai.backend.adapter.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.hiredai.backend.adapter.JobSourceAdapter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.List;

/**
 * Uses Arbeitnow's public, keyless job-board API: https://www.arbeitnow.com/api/job-board-api
 * No authentication or scraping involved — this is Arbeitnow's documented public API.
 * The API doesn't support free-text search server-side, so keyword/location filtering
 * happens client-side against the returned page of listings.
 */
@Component
@RequiredArgsConstructor
public class ArbeitnowAdapter implements JobSourceAdapter {

    private static final String URL = "https://www.arbeitnow.com/api/job-board-api";

    private final RestClient restClient;

    @Override
    public String getPlatformName() {
        return "Arbeitnow";
    }

    @Override
    public List<JobListingData> fetchJobs(SearchCriteria criteria) {
        ArbeitnowResponse response = restClient.get()
                .uri(URL)
                .retrieve()
                .body(ArbeitnowResponse.class);

        if (response == null || response.data() == null) {
            return List.of();
        }

        String keyword = (criteria.keywords() != null && !criteria.keywords().isEmpty())
                ? criteria.keywords().get(0).toLowerCase() : null;

        return response.data().stream()
                .filter(job -> keyword == null
                        || (job.title() != null && job.title().toLowerCase().contains(keyword))
                        || (job.description() != null && job.description().toLowerCase().contains(keyword)))
                .map(this::toJobListingData)
                .toList();
    }

    private JobListingData toJobListingData(ArbeitnowJob job) {
        Instant postedAt = job.createdAt() != null ? Instant.ofEpochSecond(job.createdAt()) : null;
        String location = job.remote() ? "Remote" : job.location();
        return new JobListingData(
                job.slug(),
                job.title(),
                job.companyName(),
                location,
                job.description(),
                null,
                job.url(),
                postedAt);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ArbeitnowResponse(List<ArbeitnowJob> data) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ArbeitnowJob(
            String slug,
            @JsonProperty("company_name") String companyName,
            String title,
            String description,
            boolean remote,
            String url,
            String location,
            @JsonProperty("created_at") Long createdAt) {}
}
