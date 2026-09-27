package com.hiredai.backend.repository;

import com.hiredai.backend.entity.JobListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface JobListingRepository extends JpaRepository<JobListing, String>, JpaSpecificationExecutor<JobListing> {
    Optional<JobListing> findByPlatformAndExternalJobId(String platform, String externalJobId);
    java.util.List<JobListing> findByPlatformAndExternalJobIdIn(String platform, java.util.Collection<String> externalJobIds);
}
