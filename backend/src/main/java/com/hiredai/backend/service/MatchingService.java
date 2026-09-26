package com.hiredai.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Intelligent keyword & skill overlap match scoring between candidate resume profile and job listings.
 * Computes realistic, normalized 0 - 100% match scores by comparing extracted resume skills & terms
 * against job titles and descriptions, filtering stop words and boosting title relevance.
 */
@Service
@Slf4j
public class MatchingService {

    private static final Pattern WORD_PATTERN = Pattern.compile("[a-zA-Z0-9+#.]{2,}");
    private static final Set<String> STOP_WORDS = Set.of(
            "the", "and", "is", "in", "to", "for", "with", "a", "an", "on", "at", "by", "this", "that", "from",
            "or", "be", "are", "as", "will", "our", "team", "work", "job", "company", "role", "years", "experience",
            "looking", "seeking", "about", "we", "you", "your", "have", "has", "had", "all", "can", "must", "should",
            "using", "used", "new", "full", "part", "time", "remote", "hybrid", "location", "apply", "contact",
            "email", "phone", "skills", "rawtext", "parsedjson", "null", "undefined", "true", "false"
    );

    private final ObjectMapper objectMapper = new ObjectMapper();

    public double scoreMatch(String resumeTextOrJson, String jobTitleAndDescription) {
        if (resumeTextOrJson == null || jobTitleAndDescription == null ||
                resumeTextOrJson.isBlank() || jobTitleAndDescription.isBlank()) {
            return 0.0;
        }

        Set<String> resumeTokens = extractResumeTokens(resumeTextOrJson);
        Set<String> jobTokens = tokenize(jobTitleAndDescription);

        if (resumeTokens.isEmpty() || jobTokens.isEmpty()) {
            return 0.0;
        }

        Set<String> overlap = new HashSet<>(resumeTokens);
        overlap.retainAll(jobTokens);

        if (overlap.isEmpty()) {
            return 0.0;
        }

        // Calculate overlap ratio relative to key skills count to prevent dilution by long descriptions
        double denominator = Math.min(resumeTokens.size(), Math.max(5, jobTokens.size() / 4.0));
        double tokenRatio = Math.min(1.0, overlap.size() / denominator);

        // Base score mapped to 0 - 100 range
        double rawScore = tokenRatio * 75.0;

        // Title match boost: if job title contains candidate resume keywords
        String lowerJobText = jobTitleAndDescription.toLowerCase();
        long titleMatches = resumeTokens.stream()
                .filter(token -> token.length() > 2 && lowerJobText.contains(token))
                .count();

        double titleBoost = Math.min(24.0, titleMatches * 6.0);
        double finalScore = Math.min(99.0, Math.max(15.0, rawScore + titleBoost));

        return Math.round(finalScore * 10.0) / 10.0; // 1 decimal place percentage (e.g. 92.5%)
    }

    private Set<String> extractResumeTokens(String textOrJson) {
        Set<String> tokens = new HashSet<>();

        try {
            if (textOrJson.trim().startsWith("{")) {
                JsonNode root = objectMapper.readTree(textOrJson);
                if (root.has("skills") && root.get("skills").isArray()) {
                    for (JsonNode skillNode : root.get("skills")) {
                        tokens.addAll(tokenize(skillNode.asText()));
                    }
                }
                if (root.has("rawText")) {
                    tokens.addAll(tokenize(root.get("rawText").asText()));
                }
            }
        } catch (Exception ignored) {
            // Fallback to tokenizing raw text string directly
        }

        if (tokens.isEmpty()) {
            tokens.addAll(tokenize(textOrJson));
        }

        return tokens;
    }

    private Set<String> tokenize(String text) {
        if (text == null || text.isBlank()) {
            return Set.of();
        }
        Set<String> tokens = new HashSet<>();
        Matcher matcher = WORD_PATTERN.matcher(text.toLowerCase());
        while (matcher.find()) {
            String word = matcher.group();
            if (!STOP_WORDS.contains(word)) {
                tokens.add(word);
            }
        }
        return tokens;
    }
}
