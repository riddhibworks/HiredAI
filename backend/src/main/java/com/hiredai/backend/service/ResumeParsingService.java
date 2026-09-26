package com.hiredai.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.sax.BodyContentHandler;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Extracts raw text via Apache Tika and applies lightweight heuristics to pull out
 * structured fields. This is intentionally simple; a production system would likely
 * layer an NLP/LLM-based extractor on top of the raw text captured here.
 */
@Service
public class ResumeParsingService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("[\\w.+-]+@[\\w-]+\\.[\\w.-]+");
    private static final Pattern PHONE_PATTERN = Pattern.compile("(\\+?\\d[\\d\\-.\\s()]{7,}\\d)");

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String parseToJson(byte[] fileBytes) {
        try {
            BodyContentHandler handler = new BodyContentHandler(-1);
            Metadata metadata = new Metadata();
            AutoDetectParser parser = new AutoDetectParser();
            parser.parse(new ByteArrayInputStream(fileBytes), handler, metadata, new ParseContext());

            String text = handler.toString();

            Map<String, Object> parsed = new LinkedHashMap<>();
            parsed.put("email", firstMatch(EMAIL_PATTERN, text));
            parsed.put("phone", firstMatch(PHONE_PATTERN, text));
            parsed.put("skills", extractSkills(text));
            parsed.put("rawText", text);

            return objectMapper.writeValueAsString(parsed);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse resume: " + e.getMessage(), e);
        }
    }

    private String firstMatch(Pattern pattern, String text) {
        Matcher m = pattern.matcher(text);
        return m.find() ? m.group() : null;
    }

    private java.util.List<String> extractSkills(String text) {
        // Placeholder keyword-overlap approach against a small common-skills dictionary.
        String[] dictionary = {"java", "spring", "react", "typescript", "python", "sql", "aws",
                "docker", "kubernetes", "kafka", "rabbitmq", "postgresql", "redis", "node.js", "javascript"};
        String lower = text.toLowerCase();
        java.util.List<String> found = new java.util.ArrayList<>();
        for (String skill : dictionary) {
            if (lower.contains(skill)) {
                found.add(skill);
            }
        }
        return found;
    }
}
