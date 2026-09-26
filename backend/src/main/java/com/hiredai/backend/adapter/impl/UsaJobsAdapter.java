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
 * Uses USAJobs' official Search API: https://developer.usajobs.gov/api-reference/get-api-search
 * Requires a free API key plus the email address it was registered with
 * (app.sources.usajobs.api-key / user-agent-email). When either is unset this
 * adapter is a no-op so ingestion doesn't fail for installs that haven't registered.
 */
@Component
@Slf4j
public class UsaJobsAdapter implements JobSourceAdapter {

    private static final String URL = "https://data.usajobs.gov/api/search";

    private final RestClient restClient;

    @Value("${app.sources.usajobs.api-key:}")
    private String apiKey;

    @Value("${app.sources.usajobs.user-agent-email:}")
    private String userAgentEmail;

    public UsaJobsAdapter(RestClient restClient) {
        this.restClient = restClient;
    }

    @Override
    public String getPlatformName() {
        return "USAJobs";
    }

    @Override
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank() && userAgentEmail != null && !userAgentEmail.isBlank();
    }

    @Override
    public List<JobListingData> fetchJobs(SearchCriteria criteria) {
        if (!isConfigured()) {
            return List.of();
        }

        var uriBuilder = UriComponentsBuilder.fromHttpUrl(URL).queryParam("ResultsPerPage", 50);
        String keyword = (criteria.keywords() != null && !criteria.keywords().isEmpty()) ? criteria.keywords().get(0) : null;
        if (keyword != null && !keyword.isBlank()) {
            uriBuilder.queryParam("Keyword", keyword);
        }

        UsaJobsResponse response = restClient.get()
                .uri(uriBuilder.build().toUri())
                .header("Host", "data.usajobs.gov")
                .header("User-Agent", userAgentEmail)
                .header("Authorization-Key", apiKey)
                .retrieve()
                .body(UsaJobsResponse.class);

        if (response == null || response.searchResult() == null || response.searchResult().searchResultItems() == null) {
            return List.of();
        }

        return response.searchResult().searchResultItems().stream()
                .filter(item -> item.descriptor() != null && item.descriptor().positionTitle() != null)
                .map(this::toJobListingData)
                .toList();
    }

    private JobListingData toJobListingData(UsaJobsResultItem item) {
        UsaJobsDescriptor descriptor = item.descriptor();
        return new JobListingData(
                item.matchedObjectId(),
                descriptor.positionTitle(),
                descriptor.organizationName(),
                descriptor.positionLocationDisplay(),
                descriptor.userArea() != null && descriptor.userArea().details() != null
                        ? descriptor.userArea().details().jobSummary() : null,
                buildSalaryRange(descriptor),
                descriptor.positionUri(),
                parsePostedAt(descriptor.publicationStartDate()));
    }

    private String buildSalaryRange(UsaJobsDescriptor descriptor) {
        if (descriptor.positionRemuneration() == null || descriptor.positionRemuneration().isEmpty()) {
            return null;
        }
        UsaJobsRemuneration remuneration = descriptor.positionRemuneration().get(0);
        if (remuneration.minimumRange() == null && remuneration.maximumRange() == null) {
            return null;
        }
        if (remuneration.minimumRange() != null && remuneration.maximumRange() != null) {
            return "$" + remuneration.minimumRange() + " - $" + remuneration.maximumRange();
        }
        return "$" + (remuneration.minimumRange() != null ? remuneration.minimumRange() : remuneration.maximumRange());
    }

    private Instant parsePostedAt(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(raw);
        } catch (Exception e) {
            log.debug("Could not parse USAJobs PublicationStartDate '{}': {}", raw, e.getMessage());
            return null;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record UsaJobsResponse(@JsonProperty("SearchResult") UsaJobsSearchResult searchResult) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record UsaJobsSearchResult(@JsonProperty("SearchResultItems") List<UsaJobsResultItem> searchResultItems) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record UsaJobsResultItem(
            @JsonProperty("MatchedObjectId") String matchedObjectId,
            @JsonProperty("MatchedObjectDescriptor") UsaJobsDescriptor descriptor) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record UsaJobsDescriptor(
            @JsonProperty("PositionTitle") String positionTitle,
            @JsonProperty("PositionURI") String positionUri,
            @JsonProperty("OrganizationName") String organizationName,
            @JsonProperty("PositionLocationDisplay") String positionLocationDisplay,
            @JsonProperty("PositionRemuneration") List<UsaJobsRemuneration> positionRemuneration,
            @JsonProperty("PublicationStartDate") String publicationStartDate,
            @JsonProperty("UserArea") UsaJobsUserArea userArea) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record UsaJobsRemuneration(
            @JsonProperty("MinimumRange") String minimumRange,
            @JsonProperty("MaximumRange") String maximumRange) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record UsaJobsUserArea(@JsonProperty("Details") UsaJobsDetails details) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record UsaJobsDetails(@JsonProperty("JobSummary") String jobSummary) {}
}
