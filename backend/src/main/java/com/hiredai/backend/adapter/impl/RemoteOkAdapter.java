package com.hiredai.backend.adapter.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.hiredai.backend.adapter.JobSourceAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

/**
 * Uses RemoteOK's public, keyless jobs API: https://remoteok.com/api
 * No authentication or scraping involved — this is RemoteOK's documented public API.
 * The first array element is always a metadata/legal notice object (no "position"),
 * so entries without a position are filtered out.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RemoteOkAdapter implements JobSourceAdapter {

    private static final String URL = "https://remoteok.com/api";

    private final RestClient restClient;

    @Override
    public String getPlatformName() {
        return "RemoteOK";
    }

    @Override
    public List<JobListingData> fetchJobs(SearchCriteria criteria) {
        List<RemoteOkJob> jobs = restClient.get()
                .uri(URL)
                .header("User-Agent", "HiredAI-JobAggregator/1.0")
                .retrieve()
                .body(new ParameterizedTypeReference<List<RemoteOkJob>>() {});

        if (jobs == null) {
            return List.of();
        }

        String keyword = (criteria.keywords() != null && !criteria.keywords().isEmpty())
                ? criteria.keywords().get(0).toLowerCase() : null;

        return jobs.stream()
                .filter(job -> job.position() != null && job.id() != null)
                .filter(job -> keyword == null
                        || job.position().toLowerCase().contains(keyword)
                        || (job.description() != null && job.description().toLowerCase().contains(keyword)))
                .map(this::toJobListingData)
                .toList();
    }

    private JobListingData toJobListingData(RemoteOkJob job) {
        return new JobListingData(
                job.id(),
                job.position(),
                job.company(),
                job.location() != null && !job.location().isBlank() ? job.location() : "Remote",
                job.description(),
                buildSalaryRange(job),
                Objects.requireNonNullElse(job.applyUrl(), job.url()),
                parsePostedAt(job));
    }

    private String buildSalaryRange(RemoteOkJob job) {
        if (job.salaryMin() == null || job.salaryMax() == null || job.salaryMin() == 0 || job.salaryMax() == 0) {
            return null;
        }
        return "$" + job.salaryMin() + " - $" + job.salaryMax();
    }

    private Instant parsePostedAt(RemoteOkJob job) {
        if (job.epoch() == null) {
            return null;
        }
        try {
            return Instant.ofEpochSecond(job.epoch());
        } catch (Exception e) {
            log.debug("Could not parse RemoteOK epoch '{}': {}", job.epoch(), e.getMessage());
            return null;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record RemoteOkJob(
            String id,
            String slug,
            Long epoch,
            String company,
            String position,
            String description,
            String location,
            @JsonProperty("apply_url") String applyUrl,
            String url,
            @JsonProperty("salary_min") Long salaryMin,
            @JsonProperty("salary_max") Long salaryMax) {}
}
