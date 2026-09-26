package com.hiredai.backend.service;

import com.hiredai.backend.entity.Resume;
import com.hiredai.backend.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
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
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final ResumeParsingService resumeParsingService;

    @Value("${app.storage.resume-dir}")
    private String resumeDir;

    @Transactional
    public Resume upload(String userId, String label, MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";

        boolean isPdf = originalFilename.endsWith(".pdf") || contentType.contains("pdf");
        boolean isDoc = originalFilename.endsWith(".docx") || originalFilename.endsWith(".doc") || contentType.contains("word") || contentType.contains("msword");

        if (!isPdf && !isDoc) {
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

            String parsedJson = resumeParsingService.parseToJson(bytes);

            Resume resume = new Resume();
            resume.setUserId(userId);
            resume.setLabel(label != null && !label.isBlank() ? label : file.getOriginalFilename());
            resume.setFileUrl(target.toString());
            resume.setParsedJson(parsedJson);
            resume.setDefault(resumeRepository.findByUserId(userId).isEmpty());

            return resumeRepository.save(resume);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store resume file");
        }
    }

    @Transactional(readOnly = true)
    public List<Resume> listForUser(String userId) {
        return resumeRepository.findByUserId(userId);
    }

    @Transactional
    public void delete(String userId, String resumeId) {
        Resume resume = resumeRepository.findByIdAndUserId(resumeId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resume not found"));

        try {
            Files.deleteIfExists(Paths.get(resume.getFileUrl()));
        } catch (IOException ignored) {
            // best-effort cleanup; DB record removal below is the source of truth
        }

        resumeRepository.delete(resume);
    }
}
