package com.hiredai.backend.service;

import com.hiredai.backend.entity.Resume;
import com.hiredai.backend.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final ResumeParsingService resumeParsingService;

    @Value("${app.storage.resume-dir}")
    private String resumeDir;

    @Transactional
    public Resume upload(String userId, String label, MultipartFile file) {
        log.info("[Resume] Starting upload for user={}, filename={}, size={}", userId, file.getOriginalFilename(), file.getSize());
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";

        boolean isPdf = originalFilename.endsWith(".pdf") || contentType.contains("pdf");
        boolean isDoc = originalFilename.endsWith(".docx") || originalFilename.endsWith(".doc") || contentType.contains("word") || contentType.contains("msword");

        if (!isPdf && !isDoc) {
            log.warn("[Resume] Rejected upload — unsupported file type: {} (contentType={})", originalFilename, contentType);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PDF or DOCX/DOC files are supported");
        }

        try {
            Path dir = Paths.get(resumeDir, userId);
            Files.createDirectories(dir);

            String extension = isPdf ? ".pdf" : (originalFilename.endsWith(".doc") ? ".doc" : ".docx");
            String storedFileName = UUID.randomUUID() + extension;
            Path target = dir.resolve(storedFileName);

            byte[] bytes = file.getBytes();
            Files.write(target, bytes);
            log.debug("[Resume] Saved file to disk: {}", target);

            long parseStart = System.currentTimeMillis();
            String parsedJson = resumeParsingService.parseToJson(bytes);
            long parseElapsed = System.currentTimeMillis() - parseStart;
            log.info("[Resume] Parsed resume in {}ms (json length={})", parseElapsed, parsedJson != null ? parsedJson.length() : 0);

            Resume resume = new Resume();
            resume.setUserId(userId);
            resume.setLabel(label != null && !label.isBlank() ? label : file.getOriginalFilename());
            resume.setFileUrl(target.toString());
            resume.setParsedJson(parsedJson);
            resume.setDefault(resumeRepository.findByUserId(userId).isEmpty());

            Resume saved = resumeRepository.save(resume);
            log.info("[Resume] Upload complete: id={}, user={}, label={}", saved.getId(), userId, saved.getLabel());
            return saved;
        } catch (IOException e) {
            log.error("[Resume] Failed to store resume file for user={}: {}", userId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store resume file");
        }
    }

    @Transactional(readOnly = true)
    public List<Resume> listForUser(String userId) {
        List<Resume> resumes = resumeRepository.findByUserId(userId);
        log.debug("[Resume] listForUser: user={}, count={}", userId, resumes.size());
        return resumes;
    }

    @Transactional
    public void delete(String userId, String resumeId) {
        log.info("[Resume] Deleting resume id={} for user={}", resumeId, userId);
        Resume resume = resumeRepository.findByIdAndUserId(resumeId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resume not found"));

        try {
            Files.deleteIfExists(Paths.get(resume.getFileUrl()));
            log.debug("[Resume] Deleted file from disk: {}", resume.getFileUrl());
        } catch (IOException ignored) {
            log.debug("[Resume] Could not delete file from disk: {}", resume.getFileUrl());
        }

        resumeRepository.delete(resume);
        log.info("[Resume] Deleted resume id={}", resumeId);
    }
}
