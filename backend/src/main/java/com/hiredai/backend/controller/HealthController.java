package com.hiredai.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Dedicated health and heartbeat controller for uptime monitors, Render health checks,
 * and keep-alive pings to prevent cloud free-tier cold starts.
 */
@RestController
@Tag(name = "Health", description = "Application liveness and heartbeat endpoints")
public class HealthController {

    private final Instant startedAt = Instant.now();

    @Operation(summary = "Root status endpoint")
    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "HiredAI Backend API",
                "uptimeSince", startedAt.toString(),
                "docs", "/swagger-ui.html"
        ));
    }

    @Operation(summary = "Simple health check endpoint for uptime monitors and keep-alive pings")
    @GetMapping({"/health", "/api/health"})
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "timestamp", Instant.now().toString()
        ));
    }
}
