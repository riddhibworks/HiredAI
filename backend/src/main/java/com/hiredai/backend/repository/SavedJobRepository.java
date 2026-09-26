package com.hiredai.backend.repository;

import com.hiredai.backend.entity.SavedJob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedJobRepository extends JpaRepository<SavedJob, String> {
    List<SavedJob> findByUserId(String userId);
    Optional<SavedJob> findByUserIdAndJobListingId(String userId, String jobListingId);
    void deleteByUserIdAndJobListingId(String userId, String jobListingId);
}
