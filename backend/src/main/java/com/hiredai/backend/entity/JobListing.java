package com.hiredai.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "job_listings",
       uniqueConstraints = @UniqueConstraint(columnNames = {"platform", "external_job_id"}),
       indexes = {
           @Index(name = "idx_job_listings_fetched_at", columnList = "fetched_at DESC"),
           @Index(name = "idx_job_listings_posted_at", columnList = "posted_at DESC"),
           @Index(name = "idx_job_listings_platform", columnList = "platform")
       })
@Getter
@Setter
@NoArgsConstructor
public class JobListing {

    @Id
    private String id;

    @Column(nullable = false)
    private String platform;

    @Column(name = "external_job_id", nullable = false)
    private String externalJobId;

    private String title;
    private String company;
    private String location;

    // Plain TEXT, not @Lob: @Lob maps to a Postgres large object (oid) whose stream
    // can only be read inside the owning transaction, which broke ingestion and reads.
    @Column(columnDefinition = "TEXT")
    private String description;

    private String salaryRange;

    private Double matchScore;

    @Column(name = "posted_at")
    private Instant postedAt;

    private String sourceUrl;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "fetched_at", nullable = false)
    private Instant fetchedAt = Instant.now();
}
