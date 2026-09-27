package com.hiredai.backend.service;

import com.hiredai.backend.dto.job.JobListingResponse;
import com.hiredai.backend.entity.JobListing;
import com.hiredai.backend.entity.Resume;
import com.hiredai.backend.repository.JobListingRepository;
import com.hiredai.backend.repository.ResumeRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobListingService {

    private final JobFeedCacheService jobFeedCacheService;
    private final JobListingRepository jobListingRepository;
    private final ResumeRepository resumeRepository;
    private final SavedJobService savedJobService;
    private final MatchingService matchingService;

    @PostConstruct
    public void init() {
        try {
            List<JobListing> dbListings = jobListingRepository.findAll();
            if (!dbListings.isEmpty()) {
                jobFeedCacheService.initFromList(dbListings);
                log.info("[Feed] Pre-loaded {} listings from database into in-memory cache", dbListings.size());
            }
        } catch (Exception e) {
            log.warn("[Feed] Failed to pre-load listings from database: {}", e.getMessage());
        }
    }

    public void invalidateCache() {
        log.debug("[Feed] Cache invalidation requested");
    }

    public Page<JobListingResponse> search(String userId, String keyword, String location, String platform,
                                            Double minMatchScore, String sort, int page, int size) {
        long start = System.currentTimeMillis();
        List<JobListing> allListings = jobFeedCacheService.getAllListings();

        // If in-memory cache is still empty, fallback to DB
        if (allListings.isEmpty()) {
            allListings = jobListingRepository.findAll();
            if (!allListings.isEmpty()) {
                jobFeedCacheService.initFromList(allListings);
            }
        }

        Stream<JobListing> stream = allListings.stream();

        // 1. Platform filter
        if (platform != null && !platform.isBlank()) {
            String pLower = platform.trim();
            stream = stream.filter(j -> j.getPlatform() != null && j.getPlatform().equalsIgnoreCase(pLower));
        }

        // 2. Location filter
        if (location != null && !location.isBlank()) {
            String locLower = location.toLowerCase().trim();
            stream = stream.filter(j -> j.getLocation() != null && j.getLocation().toLowerCase().contains(locLower));
        }

        // 3. Keyword filter
        if (keyword != null && !keyword.isBlank()) {
            String[] tokens = keyword.toLowerCase().trim().split("[,\\s]+");
            stream = stream.filter(j -> {
                String fullText = (j.getTitle() != null ? j.getTitle().toLowerCase() : "") + " " +
                        (j.getCompany() != null ? j.getCompany().toLowerCase() : "") + " " +
                        (j.getDescription() != null ? j.getDescription().toLowerCase() : "");
                for (String tok : tokens) {
                    if (!tok.isBlank() && !fullText.contains(tok)) {
                        return false;
                    }
                }
                return true;
            });
        }

        String resumeText = defaultResumeText(userId);
        Set<String> savedIds = savedJobService.savedJobIdsForUser(userId);
        Set<String> appliedIds = savedJobService.appliedJobIdsForUser(userId);

        // 4. Map & match scoring
        Stream<JobListingResponse> responseStream = stream.map(listing ->
                toResponse(listing, resumeText, savedIds, appliedIds));

        // 5. Min match score filter
        if (minMatchScore != null) {
            responseStream = responseStream.filter(r -> r.matchScore() != null && r.matchScore() >= minMatchScore);
        }

        List<JobListingResponse> matched = responseStream.collect(Collectors.toCollection(ArrayList::new));

        // 6. In-memory sorting
        if ("date".equalsIgnoreCase(sort)) {
            matched.sort(Comparator.comparing((JobListingResponse r) -> r.postedAt() != null ? r.postedAt() : Instant.EPOCH).reversed());
        } else if ("salary".equalsIgnoreCase(sort)) {
            matched.sort(Comparator.comparing((JobListingResponse r) -> r.salaryRange() != null ? r.salaryRange() : "").reversed());
        } else { // "relevance" or default
            matched.sort(Comparator.comparing((JobListingResponse r) -> r.matchScore() != null ? r.matchScore() : 0.0).reversed());
        }

        int total = matched.size();
        int fromIndex = Math.min(page * size, total);
        int toIndex = Math.min(fromIndex + size, total);
        List<JobListingResponse> pageContent = matched.subList(fromIndex, toIndex);

        long elapsed = System.currentTimeMillis() - start;
        log.info("[Feed] In-memory search returned {}/{} jobs in {}ms (page={}, size={}, sort={})",
                pageContent.size(), total, elapsed, page, size, sort);

        return new PageImpl<>(pageContent, PageRequest.of(page, size), total);
    }

    public JobListingResponse getOrThrow(String userId, String id) {
        JobListing listing = jobFeedCacheService.getById(id)
                .or(() -> jobListingRepository.findById(id))
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Job listing not found"));
        String resumeText = defaultResumeText(userId);
        Set<String> savedIds = savedJobService.savedJobIdsForUser(userId);
        Set<String> appliedIds = savedJobService.appliedJobIdsForUser(userId);
        return toResponse(listing, resumeText, savedIds, appliedIds);
    }

    public List<String> getAvailablePlatforms() {
        List<String> cached = jobFeedCacheService.getAvailablePlatforms();
        if (!cached.isEmpty()) {
            return cached;
        }
        return List.of("Arbeitnow", "Himalayas", "Jobicy", "RemoteOK", "Remotive", "WeWorkRemotely");
    }

    private JobListingResponse toResponse(JobListing listing, String resumeText, Set<String> savedIds, Set<String> appliedIds) {
        Double matchScore = listing.getMatchScore();
        if (resumeText != null && (listing.getTitle() != null || listing.getDescription() != null)) {
            String fullText = (listing.getTitle() != null ? listing.getTitle() + " " : "") +
                    (listing.getDescription() != null ? listing.getDescription() : "");
            matchScore = matchingService.scoreMatch(resumeText, fullText);
        }
        return new JobListingResponse(listing.getId(), listing.getPlatform(), listing.getExternalJobId(),
                listing.getTitle(), listing.getCompany(), listing.getLocation(), listing.getDescription(),
                listing.getSalaryRange(), matchScore, listing.getPostedAt(), listing.getSourceUrl(),
                savedIds.contains(listing.getId()), appliedIds.contains(listing.getId()));
    }

    private String defaultResumeText(String userId) {
        if (userId == null) {
            return null;
        }
        List<Resume> userResumes = resumeRepository.findByUserId(userId);
        if (userResumes.isEmpty()) {
            return null;
        }
        return userResumes.stream()
                .filter(Resume::isDefault)
                .findFirst()
                .orElse(userResumes.get(0))
                .getParsedJson();
    }
}
