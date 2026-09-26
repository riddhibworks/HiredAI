package com.hiredai.backend.service;

import com.hiredai.backend.dto.job.JobListingResponse;
import com.hiredai.backend.entity.JobListing;
import com.hiredai.backend.entity.Resume;
import com.hiredai.backend.repository.JobListingRepository;
import com.hiredai.backend.repository.JobListingSpecifications;
import com.hiredai.backend.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class JobListingService {

    private final JobListingRepository jobListingRepository;
    private final ResumeRepository resumeRepository;
    private final SavedJobService savedJobService;
    private final MatchingService matchingService;

    public Page<JobListingResponse> search(String userId, String keyword, String location, String platform,
                                            Double minMatchScore, String sort, int page, int size) {
        Specification<JobListing> spec = Specification.allOf(Stream.of(
                        JobListingSpecifications.keyword(keyword),
                        JobListingSpecifications.location(location),
                        JobListingSpecifications.platform(platform))
                .filter(Objects::nonNull)
                .toList());

        Page<JobListing> results = jobListingRepository.findAll(spec, PageRequest.of(page, size, resolveSort(sort)));

        String resumeText = defaultResumeText(userId);
        Set<String> savedIds = savedJobService.savedJobIdsForUser(userId);
        Set<String> appliedIds = savedJobService.appliedJobIdsForUser(userId);

        List<JobListingResponse> content = results.getContent().stream()
                .map(listing -> toResponse(listing, resumeText, savedIds, appliedIds))
                .filter(r -> minMatchScore == null || (r.matchScore() != null && r.matchScore() >= minMatchScore))
                .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));

        if ("relevance".equals(sort)) {
            content.sort(Comparator.comparing((JobListingResponse r) -> r.matchScore() != null ? r.matchScore() : 0.0).reversed());
        }

        return new org.springframework.data.domain.PageImpl<>(content, results.getPageable(), results.getTotalElements());
    }

    public JobListingResponse getOrThrow(String userId, String id) {
        JobListing listing = jobListingRepository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Job listing not found"));
        String resumeText = defaultResumeText(userId);
        Set<String> savedIds = savedJobService.savedJobIdsForUser(userId);
        Set<String> appliedIds = savedJobService.appliedJobIdsForUser(userId);
        return toResponse(listing, resumeText, savedIds, appliedIds);
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

    private Sort resolveSort(String sort) {
        if ("date".equals(sort)) {
            return Sort.by(Sort.Direction.DESC, "postedAt");
        }
        if ("salary".equals(sort)) {
            return Sort.by(Sort.Direction.DESC, "salaryRange");
        }
        return Sort.by(Sort.Direction.DESC, "fetchedAt");
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
