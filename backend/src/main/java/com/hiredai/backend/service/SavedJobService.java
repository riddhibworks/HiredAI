package com.hiredai.backend.service;

import com.hiredai.backend.dto.savedjob.SavedJobResponse;
import com.hiredai.backend.entity.JobListing;
import com.hiredai.backend.entity.SavedJob;
import com.hiredai.backend.repository.JobListingRepository;
import com.hiredai.backend.repository.SavedJobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SavedJobService {

    private final SavedJobRepository savedJobRepository;
    private final JobListingRepository jobListingRepository;

    public SavedJobResponse save(String userId, String jobListingId) {
        JobListing listing = jobListingRepository.findById(jobListingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job listing not found"));
        SavedJob saved = savedJobRepository.findByUserIdAndJobListingId(userId, jobListingId)
                .orElseGet(() -> savedJobRepository.save(new SavedJob(userId, jobListingId)));
        return SavedJobResponse.from(saved, listing);
    }

    @Transactional
    public void unsave(String userId, String jobListingId) {
        savedJobRepository.deleteByUserIdAndJobListingId(userId, jobListingId);
    }

    public SavedJobResponse markApplied(String userId, String jobListingId, boolean applied, String notes) {
        JobListing listing = jobListingRepository.findById(jobListingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job listing not found"));
        SavedJob saved = savedJobRepository.findByUserIdAndJobListingId(userId, jobListingId)
                .orElseGet(() -> new SavedJob(userId, jobListingId));
        saved.setAppliedManually(applied);
        if (notes != null) {
            saved.setNotes(notes);
        }
        savedJobRepository.save(saved);
        return SavedJobResponse.from(saved, listing);
    }

    public List<SavedJobResponse> listForUser(String userId) {
        List<SavedJob> savedJobs = savedJobRepository.findByUserId(userId);
        Map<String, JobListing> listingsById = jobListingRepository
                .findAllById(savedJobs.stream().map(SavedJob::getJobListingId).toList())
                .stream()
                .collect(Collectors.toMap(JobListing::getId, listing -> listing));
        return savedJobs.stream()
                .map(saved -> SavedJobResponse.from(saved, listingsById.get(saved.getJobListingId())))
                .toList();
    }

    public Set<String> savedJobIdsForUser(String userId) {
        if (userId == null) {
            return Set.of();
        }
        return savedJobRepository.findByUserId(userId).stream()
                .map(SavedJob::getJobListingId)
                .collect(Collectors.toSet());
    }

    public Set<String> appliedJobIdsForUser(String userId) {
        if (userId == null) {
            return Set.of();
        }
        return savedJobRepository.findByUserId(userId).stream()
                .filter(SavedJob::isAppliedManually)
                .map(SavedJob::getJobListingId)
                .collect(Collectors.toSet());
    }
}
