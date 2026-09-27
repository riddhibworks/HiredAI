package com.hiredai.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "saved_jobs", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "job_listing_id"}))
@Getter
@Setter
@NoArgsConstructor
public class SavedJob {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "job_listing_id", nullable = false)
    private String jobListingId;

    @Column(name = "saved_at", nullable = false)
    private Instant savedAt = Instant.now();

    @Column(name = "applied_manually")
    private boolean appliedManually;

    // Plain TEXT, not @Lob: see JobListing.description for why @Lob breaks outside a live transaction.
    @Column(columnDefinition = "TEXT")
    private String notes;

    public SavedJob(String userId, String jobListingId) {
        this.userId = userId;
        this.jobListingId = jobListingId;
    }
}
