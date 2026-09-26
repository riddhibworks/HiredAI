package com.hiredai.backend.repository;

import com.hiredai.backend.entity.JobSource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JobSourceRepository extends JpaRepository<JobSource, String> {
    List<JobSource> findByEnabledTrue();
    Optional<JobSource> findByFeedUrl(String feedUrl);
}
