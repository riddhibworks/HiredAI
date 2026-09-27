package com.hiredai.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "job_listings",
       uniqueConstraints = @UniqueConstraint(columnNames = {"platform", "externalJobId"}),
       indexes = {
           @Index(name = "idx_job_listings_fetched_at", columnList = "fetchedAt DESC"),
           @Index(name = "idx_job_listings_posted_at", columnList = "postedAt DESC"),
           @Index(name = "idx_job_listings_platform", columnList = "platform")
       })
@Getter
@Setter
@NoArgsConstructor
public class JobListing {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String platform;

    @Column(nullable = false)
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

    private Instant postedAt;

    private String sourceUrl;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant fetchedAt = Instant.now();
}
