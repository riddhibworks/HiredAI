package com.hiredai.backend.repository;

import com.hiredai.backend.entity.JobListing;
import org.springframework.data.jpa.domain.Specification;

public final class JobListingSpecifications {

    private JobListingSpecifications() {}

    public static Specification<JobListing> keyword(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }
        String[] tokens = keyword.toLowerCase().trim().split("[,\\s]+");
        Specification<JobListing> combined = null;
        for (String token : tokens) {
            if (token.isBlank()) continue;
            String pattern = "%" + token + "%";
            Specification<JobListing> spec = (root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern),
                    cb.like(cb.lower(root.get("company")), pattern));
            combined = (combined == null) ? spec : combined.and(spec);
        }
        return combined;
    }

    public static Specification<JobListing> location(String location) {
        if (location == null || location.isBlank()) {
            return null;
        }
        String pattern = "%" + location.toLowerCase() + "%";
        return (root, query, cb) -> cb.like(cb.lower(root.get("location")), pattern);
    }

    public static Specification<JobListing> platform(String platform) {
        if (platform == null || platform.isBlank()) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("platform"), platform);
    }

    public static Specification<JobListing> minMatch(Double minMatch) {
        if (minMatch == null) {
            return null;
        }
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("matchScore"), minMatch);
    }

    public static Specification<JobListing> postedAfter(java.time.Instant since) {
        if (since == null) {
            return null;
        }
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("postedAt"), since);
    }
}
