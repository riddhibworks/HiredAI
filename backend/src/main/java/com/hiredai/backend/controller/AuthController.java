package com.hiredai.backend.controller;

import com.hiredai.backend.dto.auth.AuthResponse;
import com.hiredai.backend.dto.auth.LoginRequest;
import com.hiredai.backend.dto.auth.RegisterRequest;
import com.hiredai.backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Endpoints for user registration and authentication")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Register a new user account")
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("POST /auth/register — email={}", request.email());
        return ResponseEntity.ok(authService.register(request));
    }

    @Operation(summary = "Login to existing user account")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("POST /auth/login — email={}", request.email());
        return ResponseEntity.ok(authService.login(request));
    }
}

