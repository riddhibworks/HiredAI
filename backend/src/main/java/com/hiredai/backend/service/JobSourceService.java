package com.hiredai.backend.service;

import com.hiredai.backend.dto.jobsource.JobSourceRequest;
import com.hiredai.backend.dto.jobsource.JobSourceResponse;
import com.hiredai.backend.entity.JobSource;
import com.hiredai.backend.entity.JobSourceType;
import com.hiredai.backend.repository.JobSourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobSourceService {

    private final JobSourceRepository jobSourceRepository;
    private final FeedUrlValidator feedUrlValidator;

    public List<JobSourceResponse> list(String userId) {
        return jobSourceRepository.findAll().stream()
                .map(source -> JobSourceResponse.from(source, userId))
                .toList();
    }

    public JobSourceResponse create(String userId, JobSourceRequest request) {
        String feedUrl = request.feedUrl().trim();
        JobSourceType type = request.sourceTypeOrDefault();

        try {
            feedUrlValidator.validateOrThrow(feedUrl);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }

        if (type == JobSourceType.JSON_API && (isBlank(request.listPath()) || isBlank(request.titlePath()) || isBlank(request.urlPath()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "JSON sources require at least a list path, title path, and URL path");
        }

        if (jobSourceRepository.findByFeedUrl(feedUrl).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This feed has already been added");
        }

        JobSource source = new JobSource();
        source.setName(request.name().trim());
        source.setFeedUrl(feedUrl);
        source.setAddedByUserId(userId);
        source.setSourceType(type);
        if (type == JobSourceType.JSON_API) {
            source.setListPath(request.listPath().trim());
            source.setTitlePath(request.titlePath().trim());
            source.setCompanyPath(blankToNull(request.companyPath()));
            source.setLocationPath(blankToNull(request.locationPath()));
            source.setDescriptionPath(blankToNull(request.descriptionPath()));
            source.setUrlPath(request.urlPath().trim());
            source.setExternalIdPath(blankToNull(request.externalIdPath()));
            source.setPostedAtPath(blankToNull(request.postedAtPath()));
        }
        jobSourceRepository.save(source);
        return JobSourceResponse.from(source, userId);
    }

    public JobSourceResponse toggle(String userId, String id) {
        JobSource source = findOwnedOrThrow(userId, id);
        source.setEnabled(!source.isEnabled());
        jobSourceRepository.save(source);
        return JobSourceResponse.from(source, userId);
    }

    public void delete(String userId, String id) {
        JobSource source = findOwnedOrThrow(userId, id);
        jobSourceRepository.delete(source);
    }

    private JobSource findOwnedOrThrow(String userId, String id) {
        JobSource source = jobSourceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job source not found"));
        if (!source.getAddedByUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the user who added a source can modify it");
        }
        return source;
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static String blankToNull(String s) {
        return isBlank(s) ? null : s.trim();
    }
}
