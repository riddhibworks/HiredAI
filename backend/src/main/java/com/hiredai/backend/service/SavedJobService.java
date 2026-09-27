package com.hiredai.backend.service;

import com.hiredai.backend.dto.savedjob.SavedJobResponse;
import com.hiredai.backend.entity.JobListing;
import com.hiredai.backend.entity.SavedJob;
import com.hiredai.backend.repository.JobListingRepository;
import com.hiredai.backend.repository.SavedJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SavedJobService {

    private final SavedJobRepository savedJobRepository;
    private final JobListingRepository jobListingRepository;
    private final JobFeedCacheService jobFeedCacheService;

    @Transactional
    public SavedJobResponse save(String userId, String jobListingId) {
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User must be authenticated to save jobs");
        }
        JobListing listing = findOrCreateListing(jobListingId);
        String canonicalJobId = listing.getId();

        SavedJob saved = savedJobRepository.findByUserIdAndJobListingId(userId, canonicalJobId)
                .or(() -> savedJobRepository.findByUserIdAndJobListingId(userId, jobListingId))
                .orElseGet(() -> savedJobRepository.save(new SavedJob(userId, canonicalJobId)));

        if (!canonicalJobId.equals(saved.getJobListingId())) {
            saved.setJobListingId(canonicalJobId);
            saved = savedJobRepository.save(saved);
        }

        return SavedJobResponse.from(saved, listing);
    }

    @Transactional
    public void unsave(String userId, String jobListingId) {
        if (userId == null || userId.isBlank()) {
            return;
        }
        savedJobRepository.deleteByUserIdAndJobListingId(userId, jobListingId);

        // Also clean up any legacy record for the same platform/externalId
        jobFeedCacheService.getById(jobListingId).ifPresent(cached -> {
            if (cached.getPlatform() != null && cached.getExternalJobId() != null) {
                jobListingRepository.findByPlatformAndExternalJobId(cached.getPlatform(), cached.getExternalJobId())
                        .ifPresent(legacy -> {
                            if (!legacy.getId().equals(jobListingId)) {
                                savedJobRepository.deleteByUserIdAndJobListingId(userId, legacy.getId());
                            }
                        });
            }
        });
    }

    @Transactional
    public SavedJobResponse markApplied(String userId, String jobListingId, boolean applied, String notes) {
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User must be authenticated to mark jobs as applied");
        }
        JobListing listing = findOrCreateListing(jobListingId);
        String canonicalJobId = listing.getId();

        SavedJob saved = savedJobRepository.findByUserIdAndJobListingId(userId, canonicalJobId)
                .or(() -> savedJobRepository.findByUserIdAndJobListingId(userId, jobListingId))
                .orElseGet(() -> new SavedJob(userId, canonicalJobId));

        saved.setJobListingId(canonicalJobId);
        saved.setAppliedManually(applied);
        if (notes != null) {
            saved.setNotes(notes);
        }
        saved = savedJobRepository.save(saved);
        return SavedJobResponse.from(saved, listing);
    }

    public List<SavedJobResponse> listForUser(String userId) {
        if (userId == null || userId.isBlank()) {
            return List.of();
        }
        List<SavedJob> savedJobs = savedJobRepository.findByUserId(userId);
        List<String> ids = savedJobs.stream().map(SavedJob::getJobListingId).toList();
        Map<String, JobListing> listingsById = jobListingRepository
                .findAllById(ids)
                .stream()
                .collect(Collectors.toMap(JobListing::getId, listing -> listing));

        return savedJobs.stream()
                .map(saved -> {
                    JobListing listing = listingsById.get(saved.getJobListingId());
                    if (listing == null) {
                        listing = jobFeedCacheService.getById(saved.getJobListingId()).orElse(null);
                    }
                    return SavedJobResponse.from(saved, listing);
                })
                .toList();
    }

    public Set<String> savedJobIdsForUser(String userId) {
        if (userId == null || userId.isBlank()) {
            return Set.of();
        }
        return savedJobRepository.findByUserId(userId).stream()
                .map(SavedJob::getJobListingId)
                .collect(Collectors.toSet());
    }

    public Set<String> appliedJobIdsForUser(String userId) {
        if (userId == null || userId.isBlank()) {
            return Set.of();
        }
        return savedJobRepository.findByUserId(userId).stream()
                .filter(SavedJob::isAppliedManually)
                .map(SavedJob::getJobListingId)
                .collect(Collectors.toSet());
    }

    private JobListing findOrCreateListing(String jobListingId) {
        // 1. Direct check in DB by ID
        Optional<JobListing> fromDb = jobListingRepository.findById(jobListingId);
        if (fromDb.isPresent()) {
            return fromDb.get();
        }

        // 2. Lookup in cache (L1 JVM ConcurrentHashMap or L2 Redis)
        JobListing cached = jobFeedCacheService.getById(jobListingId).orElse(null);

        if (cached == null) {
            log.warn("[SavedJob] Job listing id {} not found in cache or DB", jobListingId);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Job listing not found: " + jobListingId);
        }

        // 3. Before inserting into DB, check if a row already exists with the same platform and externalJobId
        // to avoid unique constraint collisions (from previous legacy batch ingests)
        if (cached.getPlatform() != null && cached.getExternalJobId() != null) {
            Optional<JobListing> existingByPlatformAndExternalId = jobListingRepository
                    .findByPlatformAndExternalJobId(cached.getPlatform(), cached.getExternalJobId());

            if (existingByPlatformAndExternalId.isPresent()) {
                JobListing existing = existingByPlatformAndExternalId.get();
                if (!existing.getId().equals(jobListingId)) {
                    log.info("[SavedJob] Reconciling legacy listing {} to deterministic id {} for {}/{}",
                            existing.getId(), jobListingId, cached.getPlatform(), cached.getExternalJobId());

                    // Migrate any saved jobs pointing to the legacy ID
                    List<SavedJob> legacySaved = savedJobRepository.findByJobListingId(existing.getId());
                    for (SavedJob sj : legacySaved) {
                        if (savedJobRepository.findByUserIdAndJobListingId(sj.getUserId(), jobListingId).isPresent()) {
                            savedJobRepository.delete(sj);
                        } else {
                            sj.setJobListingId(jobListingId);
                            savedJobRepository.save(sj);
                        }
                    }
                    jobListingRepository.delete(existing);
                    jobListingRepository.flush();
                } else {
                    return existing;
                }
            }
        }

        // 4. Ensure ID is the deterministic UUID and persist on-demand
        cached.setId(jobListingId);
        log.info("[SavedJob] Persisting job {} ('{}') to Postgres on demand", jobListingId, cached.getTitle());
        return jobListingRepository.save(cached);
    }
}
