package com.hiredai.backend.adapter.impl;

import com.hiredai.backend.adapter.JobSourceAdapter;
import com.rometools.rome.feed.synd.SyndEntry;
import com.rometools.rome.feed.synd.SyndFeed;
import com.rometools.rome.io.SyndFeedInput;
import com.rometools.rome.io.XmlReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.util.List;
import java.util.Objects;

/**
 * Adapter for WeWorkRemotely job feed aggregation using their official public RSS feed:
 * https://weworkremotely.com/remote-jobs.rss
 * Fully unauthenticated, keyless, and standard RSS XML parsing without web scraping.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WeWorkRemotelyAdapter implements JobSourceAdapter {

    private static final String FEED_URL = "https://weworkremotely.com/remote-jobs.rss";

    private final RestClient restClient;

    @Override
    public String getPlatformName() {
        return "WeWorkRemotely";
    }

    @Override
    public List<JobListingData> fetchJobs(SearchCriteria criteria) {
        try {
            byte[] raw = restClient.get()
                    .uri(FEED_URL)
                    .header("User-Agent", "Mozilla/5.0 (compatible; HiredAI/1.0; +https://hiredai-remote.vercel.app)")
                    .retrieve()
                    .body(byte[].class);

            if (raw == null || raw.length == 0) {
                return List.of();
            }

            SyndFeed feed = new SyndFeedInput().build(new XmlReader(new ByteArrayInputStream(raw)));
            if (feed == null || feed.getEntries() == null) {
                return List.of();
            }

            String keyword = (criteria.keywords() != null && !criteria.keywords().isEmpty())
                    ? criteria.keywords().get(0).toLowerCase() : null;

            return feed.getEntries().stream()
                    .map(this::toJobListingData)
                    .filter(Objects::nonNull)
                    .filter(job -> keyword == null
                            || (job.title() != null && job.title().toLowerCase().contains(keyword))
                            || (job.description() != null && job.description().toLowerCase().contains(keyword))
                            || (job.company() != null && job.company().toLowerCase().contains(keyword)))
                    .toList();

        } catch (Exception e) {
            log.warn("Failed to fetch jobs from WeWorkRemotely RSS feed: {}", e.getMessage());
            return List.of();
        }
    }

    private JobListingData toJobListingData(SyndEntry entry) {
        String link = entry.getLink();
        String externalId = (entry.getUri() != null && !entry.getUri().isBlank()) ? entry.getUri() : link;
        if (externalId == null || externalId.isBlank()) {
            return null;
        }

        String[] parts = splitTitleAndCompany(entry.getTitle());
        String title = parts[0];
        String company = parts[1];

        String description = entry.getDescription() != null ? entry.getDescription().getValue() : null;
        Instant postedAt = entry.getPublishedDate() != null ? entry.getPublishedDate().toInstant() : null;

        return new JobListingData(
                externalId,
                title,
                company,
                "Remote",
                description,
                null,
                link,
                postedAt
        );
    }

    private String[] splitTitleAndCompany(String rawTitle) {
        if (rawTitle == null) {
            return new String[] {"", "WeWorkRemotely"};
        }
        for (String separator : new String[] {" : ", ": ", " - ", " — "}) {
            int idx = rawTitle.indexOf(separator);
            if (idx > 0 && idx < rawTitle.length() - separator.length()) {
                String company = rawTitle.substring(0, idx).trim();
                String title = rawTitle.substring(idx + separator.length()).trim();
                return new String[] {title, company};
            }
        }
        return new String[] {rawTitle.trim(), "WeWorkRemotely"};
    }
}
