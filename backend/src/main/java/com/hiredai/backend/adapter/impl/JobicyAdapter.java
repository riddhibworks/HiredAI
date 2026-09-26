package com.hiredai.backend.adapter.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hiredai.backend.adapter.JobSourceAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Uses Jobicy's public, keyless remote-jobs API: https://jobicy.com/api/v2/remote-jobs
 * No authentication or scraping involved — this is Jobicy's documented public API.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JobicyAdapter implements JobSourceAdapter {

    private static final String URL = "https://jobicy.com/api/v2/remote-jobs";

    private final RestClient restClient;

    @Override
    public String getPlatformName() {
        return "Jobicy";
    }

    @Override
    public List<JobListingData> fetchJobs(SearchCriteria criteria) {
        JobicyResponse response = restClient.get()
                .uri(URL)
                .retrieve()
                .body(JobicyResponse.class);

        if (response == null || response.jobs() == null) {
            return List.of();
        }

        String keyword = (criteria.keywords() != null && !criteria.keywords().isEmpty())
                ? criteria.keywords().get(0).toLowerCase() : null;

        return response.jobs().stream()
                .filter(job -> job.jobTitle() != null && job.id() != null)
                .filter(job -> keyword == null
                        || job.jobTitle().toLowerCase().contains(keyword)
                        || (job.jobExcerpt() != null && job.jobExcerpt().toLowerCase().contains(keyword)))
                .map(this::toJobListingData)
                .toList();
    }

    private JobListingData toJobListingData(JobicyJob job) {
        return new JobListingData(
                String.valueOf(job.id()),
                job.jobTitle(),
                job.companyName(),
                job.jobGeo() != null && !job.jobGeo().isBlank() ? job.jobGeo() : "Remote",
                job.jobDescription() != null ? job.jobDescription() : job.jobExcerpt(),
                buildSalaryRange(job),
                job.url(),
                parsePostedAt(job.pubDate()));
    }

    private String buildSalaryRange(JobicyJob job) {
        if (job.salaryMin() == null && job.salaryMax() == null) {
            return null;
        }
        String currency = job.salaryCurrency() != null ? job.salaryCurrency() + " " : "";
        if (job.salaryMin() != null && job.salaryMax() != null) {
            return currency + job.salaryMin() + " - " + job.salaryMax();
        }
        return currency + (job.salaryMin() != null ? job.salaryMin() : job.salaryMax());
    }

    private Instant parsePostedAt(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return OffsetDateTime.parse(raw).toInstant();
        } catch (Exception e) {
            log.debug("Could not parse Jobicy pubDate '{}': {}", raw, e.getMessage());
            return null;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record JobicyResponse(List<JobicyJob> jobs) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record JobicyJob(
            Long id,
            String url,
            String jobTitle,
            String companyName,
            String jobGeo,
            String jobExcerpt,
            String jobDescription,
            String pubDate,
            Long salaryMin,
            Long salaryMax,
            String salaryCurrency) {}
}
