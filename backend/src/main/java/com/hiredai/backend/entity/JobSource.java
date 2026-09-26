package com.hiredai.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** A user-added RSS/Atom feed or generic JSON API, ingested alongside the built-in platform adapters. */
@Entity
@Table(name = "job_sources", uniqueConstraints = @UniqueConstraint(columnNames = "feedUrl"))
@Getter
@Setter
@NoArgsConstructor
public class JobSource {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 2048)
    private String feedUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobSourceType sourceType = JobSourceType.RSS;

    // Dot-path field mappings into each job object, only used when sourceType == JSON_API.
    private String listPath;
    private String titlePath;
    private String companyPath;
    private String locationPath;
    private String descriptionPath;
    private String urlPath;
    private String externalIdPath;
    private String postedAtPath;

    @Column(nullable = false)
    private String addedByUserId;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
