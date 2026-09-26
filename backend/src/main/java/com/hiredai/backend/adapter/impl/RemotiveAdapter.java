package com.hiredai.backend.adapter.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.hiredai.backend.adapter.JobSourceAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Uses Remotive's public, keyless remote-jobs API: https://remotive.com/api/remote-jobs
 * No authentication or scraping involved — this is Remotive's documented public API.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RemotiveAdapter implements JobSourceAdapter {

    private static final String BASE_URL = "https://remotive.com/api/remote-jobs";
    private static final DateTimeFormatter PUBLISHED_AT_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private final RestClient restClient;

    @Override
    public String getPlatformName() {
        return "Remotive";
    }

    @Override
    public List<JobListingData> fetchJobs(SearchCriteria criteria) {
        String keyword = (criteria.keywords() != null && !criteria.keywords().isEmpty()) ? criteria.keywords().get(0) : null;

        var uriBuilder = UriComponentsBuilder.fromHttpUrl(BASE_URL).queryParam("limit", 50);
        if (keyword != null && !keyword.isBlank()) {
            uriBuilder.queryParam("search", keyword);
        }

        RemotiveResponse response = restClient.get()
                .uri(uriBuilder.build().toUri())
                .retrieve()
                .body(RemotiveResponse.class);

        if (response == null || response.jobs() == null) {
            return List.of();
        }

        return response.jobs().stream()
                .map(this::toJobListingData)
                .toList();
    }

    private JobListingData toJobListingData(RemotiveJob job) {
        Instant postedAt = parsePublicationDate(job.publicationDate());
        return new JobListingData(
                String.valueOf(job.id()),
                job.title(),
                job.companyName(),
                job.candidateRequiredLocation(),
                job.description(),
                job.salary(),
                job.url(),
                postedAt);
    }

    private Instant parsePublicationDate(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(raw, PUBLISHED_AT_FORMAT).toInstant(ZoneOffset.UTC);
        } catch (Exception e) {
            log.debug("Could not parse Remotive publication_date '{}': {}", raw, e.getMessage());
            return null;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record RemotiveResponse(@JsonProperty("job-count") int jobCount, List<RemotiveJob> jobs) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record RemotiveJob(
            long id,
            String url,
            String title,
            @JsonProperty("company_name") String companyName,
            @JsonProperty("publication_date") String publicationDate,
            @JsonProperty("candidate_required_location") String candidateRequiredLocation,
            String salary,
            String description) {}
}
