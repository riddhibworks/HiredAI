package com.hiredai.backend.adapter.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hiredai.backend.adapter.JobSourceAdapter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Uses Jooble's official Job Search API: https://jooble.org/api/about
 * Requires a free API key, appended as a path segment (app.sources.jooble.api-key).
 * When unset this adapter is a no-op so ingestion doesn't fail for installs that
 * haven't registered.
 */
@Component
@Slf4j
public class JoobleAdapter implements JobSourceAdapter {

    private static final String BASE_URL = "https://jooble.org/api/";
    private static final DateTimeFormatter UPDATED_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final RestClient restClient;

    @Value("${app.sources.jooble.api-key:}")
    private String apiKey;

    public JoobleAdapter(RestClient restClient) {
        this.restClient = restClient;
    }

    @Override
    public String getPlatformName() {
        return "Jooble";
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

        String keyword = (criteria.keywords() != null && !criteria.keywords().isEmpty()) ? criteria.keywords().get(0) : "";
        String location = (criteria.locations() != null && !criteria.locations().isEmpty()) ? criteria.locations().get(0) : "";

        JoobleResponse response = restClient.post()
                .uri(BASE_URL + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("keywords", keyword, "location", location))
                .retrieve()
                .body(JoobleResponse.class);

        if (response == null || response.jobs() == null) {
            return List.of();
        }

        return response.jobs().stream()
                .filter(job -> job.title() != null && job.link() != null)
                .map(this::toJobListingData)
                .toList();
    }

    private JobListingData toJobListingData(JoobleJob job) {
        return new JobListingData(
                job.link(),
                job.title(),
                job.company(),
                job.location(),
                job.snippet(),
                job.salary(),
                job.link(),
                parsePostedAt(job.updated()));
    }

    private Instant parsePostedAt(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(raw, UPDATED_FORMAT).toInstant(ZoneOffset.UTC);
        } catch (Exception e) {
            log.debug("Could not parse Jooble updated date '{}': {}", raw, e.getMessage());
            return null;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record JoobleResponse(List<JoobleJob> jobs) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record JoobleJob(
            String title,
            String location,
            String snippet,
            String salary,
            String company,
            String link,
            String updated) {}
}
