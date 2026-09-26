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
 * Uses The Muse's public jobs API: https://www.themuse.com/developers/api/v2
 * No authentication required for basic use; an optional API key (higher rate limits)
 * can be supplied via app.sources.themuse.api-key.
 */
@Component
@Slf4j
public class TheMuseAdapter implements JobSourceAdapter {

    private static final String BASE_URL = "https://www.themuse.com/api/public/jobs";

    private final RestClient restClient;

    @Value("${app.sources.themuse.api-key:}")
    private String apiKey;

    public TheMuseAdapter(RestClient restClient) {
        this.restClient = restClient;
    }

    @Override
    public String getPlatformName() {
        return "The Muse";
    }

    @Override
    public List<JobListingData> fetchJobs(SearchCriteria criteria) {
        var uriBuilder = UriComponentsBuilder.fromHttpUrl(BASE_URL).queryParam("page", 0);
        if (apiKey != null && !apiKey.isBlank()) {
            uriBuilder.queryParam("api_key", apiKey);
        }

        TheMuseResponse response = restClient.get()
                .uri(uriBuilder.build().toUri())
                .retrieve()
                .body(TheMuseResponse.class);

        if (response == null || response.results() == null) {
            return List.of();
        }

        String keyword = (criteria.keywords() != null && !criteria.keywords().isEmpty())
                ? criteria.keywords().get(0).toLowerCase() : null;

        return response.results().stream()
                .filter(job -> job.name() != null && job.id() != null)
                .filter(job -> keyword == null
                        || job.name().toLowerCase().contains(keyword)
                        || (job.contents() != null && job.contents().toLowerCase().contains(keyword)))
                .map(this::toJobListingData)
                .toList();
    }

    private JobListingData toJobListingData(TheMuseJob job) {
        String location = job.locations() != null && !job.locations().isEmpty()
                ? job.locations().get(0).name() : "Remote";
        String sourceUrl = job.refs() != null ? job.refs().landingPage() : null;
        return new JobListingData(
                String.valueOf(job.id()),
                job.name(),
                job.company() != null ? job.company().name() : null,
                location,
                job.contents(),
                null,
                sourceUrl,
                parsePostedAt(job.publicationDate()));
    }

    private Instant parsePostedAt(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(raw);
        } catch (Exception e) {
            log.debug("Could not parse The Muse publication_date '{}': {}", raw, e.getMessage());
            return null;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TheMuseResponse(List<TheMuseJob> results) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TheMuseJob(
            Long id,
            String name,
            String contents,
            TheMuseCompany company,
            List<TheMuseLocation> locations,
            TheMuseRefs refs,
            @JsonProperty("publication_date") String publicationDate) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TheMuseCompany(String name) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TheMuseLocation(String name) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TheMuseRefs(@JsonProperty("landing_page") String landingPage) {}
}
