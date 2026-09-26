package com.hiredai.backend.adapter.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hiredai.backend.adapter.JobSourceAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.List;

/**
 * Uses Himalayas' public, keyless remote-jobs API: https://himalayas.app/jobs/api
 * No authentication or scraping involved — this is Himalayas' documented public API.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class HimalayasAdapter implements JobSourceAdapter {

    private static final String URL = "https://himalayas.app/jobs/api?limit=50";

    private final RestClient restClient;

    @Override
    public String getPlatformName() {
        return "Himalayas";
    }

    @Override
    public List<JobListingData> fetchJobs(SearchCriteria criteria) {
        HimalayasResponse response = restClient.get()
                .uri(URL)
                .retrieve()
                .body(HimalayasResponse.class);

        if (response == null || response.jobs() == null) {
            return List.of();
        }

        String keyword = (criteria.keywords() != null && !criteria.keywords().isEmpty())
                ? criteria.keywords().get(0).toLowerCase() : null;

        return response.jobs().stream()
                .filter(job -> job.title() != null && job.guid() != null)
                .filter(job -> keyword == null
                        || job.title().toLowerCase().contains(keyword)
                        || (job.excerpt() != null && job.excerpt().toLowerCase().contains(keyword)))
                .map(this::toJobListingData)
                .toList();
    }

    private JobListingData toJobListingData(HimalayasJob job) {
        String location = job.locationRestrictions() != null && !job.locationRestrictions().isEmpty()
                ? String.join(", ", job.locationRestrictions()) : "Remote";
        return new JobListingData(
                job.guid(),
                job.title(),
                job.companyName(),
                location,
                job.description(),
                buildSalaryRange(job),
                job.applicationLink(),
                parsePostedAt(job.pubDate()));
    }

    private String buildSalaryRange(HimalayasJob job) {
        if (job.minSalary() == null && job.maxSalary() == null) {
            return null;
        }
        String currency = job.currency() != null ? job.currency() + " " : "";
        if (job.minSalary() != null && job.maxSalary() != null) {
            return currency + job.minSalary() + " - " + job.maxSalary();
        }
        return currency + (job.minSalary() != null ? job.minSalary() : job.maxSalary());
    }

    private Instant parsePostedAt(Long epochSeconds) {
        if (epochSeconds == null) {
            return null;
        }
        try {
            return Instant.ofEpochSecond(epochSeconds);
        } catch (Exception e) {
            log.debug("Could not parse Himalayas pubDate '{}': {}", epochSeconds, e.getMessage());
            return null;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record HimalayasResponse(List<HimalayasJob> jobs) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record HimalayasJob(
            String title,
            String excerpt,
            String companyName,
            String description,
            Long minSalary,
            Long maxSalary,
            String currency,
            List<String> locationRestrictions,
            Long pubDate,
            String applicationLink,
            String guid) {}
}
