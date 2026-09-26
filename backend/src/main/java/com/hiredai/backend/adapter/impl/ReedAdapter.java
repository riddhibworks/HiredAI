package com.hiredai.backend.adapter.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hiredai.backend.adapter.JobSourceAdapter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Uses Reed's official Jobseeker API: https://www.reed.co.uk/developers/Jobseeker
 * Requires a free API key (app.sources.reed.api-key), sent as the HTTP Basic auth
 * username with an empty password, per Reed's documented auth scheme. When unset
 * this adapter is a no-op so ingestion doesn't fail for installs that haven't
 * registered.
 */
@Component
@Slf4j
public class ReedAdapter implements JobSourceAdapter {

    private static final String URL = "https://www.reed.co.uk/api/1.0/search";
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("d/MM/yyyy");

    private final RestClient restClient;

    @Value("${app.sources.reed.api-key:}")
    private String apiKey;

    public ReedAdapter(RestClient restClient) {
        this.restClient = restClient;
    }

    @Override
    public String getPlatformName() {
        return "Reed";
    }

    @Override
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public List<JobListingData> fetchJobs(SearchCriteria criteria) {
        if (!isConfigured()) {
            return List.of();
        }

        var uriBuilder = UriComponentsBuilder.fromHttpUrl(URL).queryParam("resultsToTake", 50);
        String keyword = (criteria.keywords() != null && !criteria.keywords().isEmpty()) ? criteria.keywords().get(0) : null;
        if (keyword != null && !keyword.isBlank()) {
            uriBuilder.queryParam("keywords", keyword);
        }

        ReedResponse response = restClient.get()
                .uri(uriBuilder.build().toUri())
                .headers(headers -> headers.setBasicAuth(apiKey, ""))
                .retrieve()
                .body(ReedResponse.class);

        if (response == null || response.results() == null) {
            return List.of();
        }

        return response.results().stream()
                .filter(job -> job.jobTitle() != null && job.jobId() != null)
                .map(this::toJobListingData)
                .toList();
    }

    private JobListingData toJobListingData(ReedJob job) {
        return new JobListingData(
                String.valueOf(job.jobId()),
                job.jobTitle(),
                job.employerName(),
                job.locationName(),
                job.jobDescription(),
                buildSalaryRange(job),
                job.jobUrl(),
                parsePostedAt(job.date()));
    }

    private String buildSalaryRange(ReedJob job) {
        if (job.minimumSalary() == null && job.maximumSalary() == null) {
            return null;
        }
        String currency = job.currency() != null ? job.currency() + " " : "";
        if (job.minimumSalary() != null && job.maximumSalary() != null) {
            return currency + job.minimumSalary() + " - " + job.maximumSalary();
        }
        return currency + (job.minimumSalary() != null ? job.minimumSalary() : job.maximumSalary());
    }

    private Instant parsePostedAt(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            LocalDate date = LocalDate.parse(raw, DATE_FORMAT);
            return date.atStartOfDay(ZoneOffset.UTC).toInstant();
        } catch (Exception e) {
            log.debug("Could not parse Reed date '{}': {}", raw, e.getMessage());
            return null;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ReedResponse(List<ReedJob> results) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ReedJob(
            Long jobId,
            String employerName,
            String jobTitle,
            String locationName,
            String jobDescription,
            Double minimumSalary,
            Double maximumSalary,
            String currency,
            String date,
            String jobUrl) {}
}
