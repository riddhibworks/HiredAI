package com.hiredai.backend.service;

import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Simple keyword-overlap match scoring between resume text and a job description.
 * Stretch goal (per spec) is to swap this for an LLM-based fit scorer without
 * changing callers.
 */
@Service
public class MatchingService {

    private static final Pattern WORD_PATTERN = Pattern.compile("[a-zA-Z0-9+#.]{2,}");

    public double scoreMatch(String resumeText, String jobDescription) {
        if (resumeText == null || jobDescription == null || resumeText.isBlank() || jobDescription.isBlank()) {
            return 0.0;
        }

        Set<String> resumeTokens = tokenize(resumeText);
        Set<String> jobTokens = tokenize(jobDescription);

        if (jobTokens.isEmpty()) {
            return 0.0;
        }

        Set<String> overlap = new HashSet<>(resumeTokens);
        overlap.retainAll(jobTokens);

        return Math.round((overlap.size() / (double) jobTokens.size()) * 10000.0) / 100.0; // percentage, 2 decimals
    }

    private Set<String> tokenize(String text) {
        Set<String> tokens = new HashSet<>();
        var matcher = WORD_PATTERN.matcher(text.toLowerCase());
        while (matcher.find()) {
            tokens.add(matcher.group());
        }
        return tokens;
    }
}
