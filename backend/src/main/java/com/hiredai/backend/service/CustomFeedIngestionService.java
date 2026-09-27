package com.hiredai.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hiredai.backend.dto.jobsource.JobSourceRequest;
import com.hiredai.backend.entity.JobListing;
import com.hiredai.backend.entity.JobSource;
import com.hiredai.backend.entity.JobSourceType;
import com.hiredai.backend.repository.JobListingRepository;
import com.hiredai.backend.repository.JobSourceRepository;
import com.rometools.rome.feed.synd.SyndEntry;
import com.rometools.rome.feed.synd.SyndFeed;
import com.rometools.rome.io.SyndFeedInput;
import com.rometools.rome.io.XmlReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Ingests user-added RSS/Atom feeds and generic JSON APIs (see JobSource) into the shared JobListing table. */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomFeedIngestionService {

    private static final int PREVIEW_LIMIT = 5;

    private final JobSourceRepository jobSourceRepository;
    private final JobListingRepository jobListingRepository;
    private final JobFeedCacheService jobFeedCacheService;
    private final FeedUrlValidator feedUrlValidator;
    private final ObjectMapper objectMapper;

    @Qualifier("feedRestClient")
    private final RestClient feedRestClient;

    public int ingestAll() {
        List<JobSource> sources = jobSourceRepository.findByEnabledTrue();
        int total = 0;
        for (JobSource source : sources) {
            total += ingestOne(source);
        }
        return total;
    }

    private int ingestOne(JobSource source) {
        try {
            feedUrlValidator.validateOrThrow(source.getFeedUrl()); // re-check in case DNS changed since it was added
            List<ParsedJob> parsed = source.getSourceType() == JobSourceType.JSON_API
                    ? parseJson(source.getFeedUrl(), FieldMapping.from(source))
                    : parseRss(source.getFeedUrl());
            if (parsed.isEmpty()) {
                return 0;
            }
            List<com.hiredai.backend.adapter.JobSourceAdapter.JobListingData> listingData = parsed.stream()
                    .map(p -> new com.hiredai.backend.adapter.JobSourceAdapter.JobListingData(
                            p.externalId(), p.title(), p.company(), p.location(), p.description(), null, p.sourceUrl(), p.postedAt()))
                    .toList();
            jobFeedCacheService.putListingData(source.getName(), listingData);
            log.info("Ingested and cached {} listings in-memory from custom source {}", parsed.size(), source.getName());
            return parsed.size();
        } catch (Exception e) {
            log.warn("Custom feed ingestion failed for source {}: {}", source.getName(), e.getMessage());
            return 0;
        }
    }

    /** Fetches and parses a not-yet-saved source config so the UI can validate mappings before adding it. */
    public List<ParsedJob> preview(JobSourceRequest request) throws Exception {
        String feedUrl = request.feedUrl().trim();
        feedUrlValidator.validateOrThrow(feedUrl);
        List<ParsedJob> parsed = request.sourceTypeOrDefault() == JobSourceType.JSON_API
                ? parseJson(feedUrl, FieldMapping.from(request))
                : parseRss(feedUrl);
        return parsed.stream().limit(PREVIEW_LIMIT).toList();
    }

    private List<ParsedJob> parseRss(String feedUrl) throws Exception {
        byte[] raw = feedRestClient.get().uri(feedUrl).retrieve().body(byte[].class);
        if (raw == null) {
            return List.of();
        }
        SyndFeed feed = new SyndFeedInput().build(new XmlReader(new ByteArrayInputStream(raw)));
        return feed.getEntries().stream().map(this::toParsedJob).filter(Objects::nonNull).toList();
    }

    private ParsedJob toParsedJob(SyndEntry entry) {
        String externalId = entry.getUri() != null && !entry.getUri().isBlank() ? entry.getUri() : entry.getLink();
        if (externalId == null || externalId.isBlank()) {
            return null;
        }
        String[] titleParts = splitTitleAndCompany(entry.getTitle());
        Instant postedAt = entry.getPublishedDate() != null ? entry.getPublishedDate().toInstant() : null;
        return new ParsedJob(externalId, titleParts[0], titleParts[1], null,
                entry.getDescription() != null ? entry.getDescription().getValue() : null, entry.getLink(), postedAt);
    }

    private List<ParsedJob> parseJson(String url, FieldMapping mapping) throws Exception {
        String raw = feedRestClient.get().uri(url).retrieve().body(String.class);
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        JsonNode root = objectMapper.readTree(raw);
        JsonNode list = JsonPathResolver.resolve(root, mapping.listPath());
        if (!list.isArray()) {
            throw new IllegalStateException("List path '" + mapping.listPath() + "' did not resolve to a JSON array");
        }
        List<ParsedJob> results = new ArrayList<>();
        for (JsonNode item : list) {
            ParsedJob job = toParsedJob(item, mapping);
            if (job != null) {
                results.add(job);
            }
        }
        return results;
    }

    private ParsedJob toParsedJob(JsonNode item, FieldMapping mapping) {
        String url = JsonPathResolver.resolveText(item, mapping.urlPath());
        String externalId = mapping.externalIdPath() != null
                ? JsonPathResolver.resolveText(item, mapping.externalIdPath())
                : url;
        if (externalId == null || externalId.isBlank()) {
            return null;
        }
        return new ParsedJob(externalId,
                JsonPathResolver.resolveText(item, mapping.titlePath()),
                JsonPathResolver.resolveText(item, mapping.companyPath()),
                JsonPathResolver.resolveText(item, mapping.locationPath()),
                JsonPathResolver.resolveText(item, mapping.descriptionPath()),
                url,
                parseInstant(JsonPathResolver.resolveText(item, mapping.postedAtPath())));
    }

    private Instant parseInstant(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(raw);
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(raw.replace(" ", "T")).atZone(ZoneOffset.UTC).toInstant();
            } catch (Exception e2) {
                try {
                    return LocalDate.parse(raw).atStartOfDay(ZoneOffset.UTC).toInstant();
                } catch (Exception e3) {
                    return null;
                }
            }
        }
    }

    @Transactional
    public void batchUpsert(String platformName, List<ParsedJob> jobs) {
        Set<String> externalIds = jobs.stream()
                .map(ParsedJob::externalId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<String, JobListing> existingMap = jobListingRepository
                .findByPlatformAndExternalJobIdIn(platformName, externalIds)
                .stream()
                .collect(Collectors.toMap(JobListing::getExternalJobId, Function.identity(), (a, b) -> a));

        Map<String, JobListing> toSaveMap = new LinkedHashMap<>();
        Instant now = Instant.now();

        for (ParsedJob job : jobs) {
            if (job.externalId() == null || job.externalId().isBlank()) {
                continue;
            }
            JobListing listing = toSaveMap.computeIfAbsent(job.externalId(), id ->
                    existingMap.getOrDefault(id, new JobListing()));

            listing.setPlatform(platformName);
            listing.setExternalJobId(job.externalId());
            listing.setTitle(job.title());
            listing.setCompany(job.company());
            listing.setLocation(job.location());
            listing.setDescription(job.description());
            listing.setSourceUrl(job.sourceUrl());
            if (listing.getPostedAt() == null) {
                listing.setPostedAt(job.postedAt() != null ? job.postedAt() : now);
            }
            listing.setFetchedAt(now);
        }

        jobListingRepository.saveAll(toSaveMap.values());
    }

    public record ParsedJob(String externalId, String title, String company, String location, String description,
                             String sourceUrl, Instant postedAt) {}

    private record FieldMapping(String listPath, String titlePath, String companyPath, String locationPath,
                                 String descriptionPath, String urlPath, String externalIdPath, String postedAtPath) {
        static FieldMapping from(JobSourceRequest r) {
            return new FieldMapping(r.listPath(), r.titlePath(), r.companyPath(), r.locationPath(),
                    r.descriptionPath(), r.urlPath(), r.externalIdPath(), r.postedAtPath());
        }

        static FieldMapping from(JobSource s) {
            return new FieldMapping(s.getListPath(), s.getTitlePath(), s.getCompanyPath(), s.getLocationPath(),
                    s.getDescriptionPath(), s.getUrlPath(), s.getExternalIdPath(), s.getPostedAtPath());
        }
    }

    /** Many job-board RSS feeds format entry titles as "Company: Job Title" or "Company - Job Title". */
    private String[] splitTitleAndCompany(String rawTitle) {
        if (rawTitle == null) {
            return new String[] {null, null};
        }
        for (String separator : new String[] {": ", " - "}) {
            int idx = rawTitle.indexOf(separator);
            if (idx > 0 && idx < rawTitle.length() - separator.length()) {
                return new String[] {rawTitle.substring(idx + separator.length()).trim(), rawTitle.substring(0, idx).trim()};
            }
        }
        return new String[] {rawTitle, null};
    }
}
