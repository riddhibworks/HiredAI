package com.hiredai.backend.adapter.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.hiredai.backend.adapter.JobSourceAdapter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.util.List;

/**
 * Uses Adzuna's official job-search API: https://developer.adzuna.com/
 * Requires a free app_id/app_key pair (app.sources.adzuna.app-id / app-key). When
 * either is unset this adapter is a no-op so ingestion doesn't fail for installs
 * that haven't registered for Adzuna.
 */
@Component
@Slf4j
public class AdzunaAdapter implements JobSourceAdapter {

    private static final String BASE_URL = "https://api.adzuna.com/v1/api/jobs";

    private final RestClient restClient;

    @Value("${app.sources.adzuna.app-id:}")
    private String appId;

    @Value("${app.sources.adzuna.app-key:}")
    private String appKey;

    @Value("${app.sources.adzuna.country:us}")
    private String country;

    public AdzunaAdapter(RestClient restClient) {
        this.restClient = restClient;
    }

    @Override
    public String getPlatformName() {
        return "Adzuna";
    }

    @Override
    public boolean isConfigured() {
        return appId != null && !appId.isBlank() && appKey != null && !appKey.isBlank();
    }

    @Override
    public List<JobListingData> fetchJobs(SearchCriteria criteria) {
        if (!isConfigured()) {
            return List.of();
        }

        var uriBuilder = UriComponentsBuilder.fromHttpUrl(BASE_URL + "/" + country + "/search/1")
                .queryParam("app_id", appId)
                .queryParam("app_key", appKey)
                .queryParam("results_per_page", 50)
                .queryParam("content-type", "application/json");
        String keyword = (criteria.keywords() != null && !criteria.keywords().isEmpty()) ? criteria.keywords().get(0) : null;
        if (keyword != null && !keyword.isBlank()) {
            uriBuilder.queryParam("what", keyword);
        }

        AdzunaResponse response = restClient.get()
                .uri(uriBuilder.build().toUri())
                .retrieve()
                .body(AdzunaResponse.class);

        if (response == null || response.results() == null) {
            return List.of();
        }

        return response.results().stream()
                .filter(job -> job.title() != null && job.id() != null)
                .map(this::toJobListingData)
                .toList();
    }

    private JobListingData toJobListingData(AdzunaJob job) {
        return new JobListingData(
                job.id(),
                job.title(),
                job.company() != null ? job.company().displayName() : null,
                job.location() != null ? job.location().displayName() : null,
                job.description(),
                buildSalaryRange(job),
                job.redirectUrl(),
                parsePostedAt(job.created()));
    }

    private String buildSalaryRange(AdzunaJob job) {
        if (job.salaryMin() == null && job.salaryMax() == null) {
            return null;
        }
        if (job.salaryMin() != null && job.salaryMax() != null) {
            return job.salaryMin().longValue() + " - " + job.salaryMax().longValue();
        }
        return String.valueOf((job.salaryMin() != null ? job.salaryMin() : job.salaryMax()).longValue());
    }

    private Instant parsePostedAt(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(raw);
        } catch (Exception e) {
            log.debug("Could not parse Adzuna created date '{}': {}", raw, e.getMessage());
            return null;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record AdzunaResponse(List<AdzunaJob> results) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record AdzunaJob(
            String id,
            String title,
            String description,
            AdzunaCompany company,
            AdzunaLocation location,
            @JsonProperty("salary_min") Double salaryMin,
            @JsonProperty("salary_max") Double salaryMax,
            @JsonProperty("redirect_url") String redirectUrl,
            String created) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record AdzunaCompany(@JsonProperty("display_name") String displayName) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record AdzunaLocation(@JsonProperty("display_name") String displayName) {}
}
