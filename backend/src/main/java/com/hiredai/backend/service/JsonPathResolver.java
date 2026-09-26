package com.hiredai.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.MissingNode;

/** Resolves simple dot-notation paths (e.g. "data.jobs" or "company.name") against a Jackson JsonNode. */
public final class JsonPathResolver {

    private JsonPathResolver() {}

    public static JsonNode resolve(JsonNode root, String path) {
        if (root == null) {
            return MissingNode.getInstance();
        }
        if (path == null || path.isBlank()) {
            return root;
        }
        JsonNode current = root;
        for (String segment : path.split("\\.")) {
            if (current == null || current.isMissingNode()) {
                return MissingNode.getInstance();
            }
            current = segment.matches("\\d+") ? current.path(Integer.parseInt(segment)) : current.path(segment);
        }
        return current;
    }

    public static String resolveText(JsonNode root, String path) {
        if (path == null || path.isBlank()) {
            return null;
        }
        JsonNode node = resolve(root, path);
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        return node.isTextual() ? node.asText() : node.toString();
    }
}
