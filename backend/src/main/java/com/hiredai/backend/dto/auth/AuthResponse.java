package com.hiredai.backend.dto.auth;

public record AuthResponse(
        String token,
        String userId,
        String email
) {}
