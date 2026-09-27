package com.hiredai.backend.service;

import com.hiredai.backend.dto.auth.AuthResponse;
import com.hiredai.backend.dto.auth.LoginRequest;
import com.hiredai.backend.dto.auth.RegisterRequest;
import com.hiredai.backend.entity.User;
import com.hiredai.backend.repository.UserRepository;
import com.hiredai.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {
        log.info("[Auth] Registering new user: {}", request.email());
        if (userRepository.existsByEmail(request.email())) {
            log.warn("[Auth] Registration failed — email already registered: {}", request.email());
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        userRepository.save(user);

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        log.info("[Auth] User registered successfully: id={}, email={}", user.getId(), user.getEmail());
        return new AuthResponse(token, user.getId(), user.getEmail());
    }

    public AuthResponse login(LoginRequest request) {
        log.info("[Auth] Login attempt: {}", request.email());
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> {
                    log.warn("[Auth] Login failed — email not found: {}", request.email());
                    return new BadCredentialsException("Invalid email or password");
                });

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            log.warn("[Auth] Login failed — incorrect password for: {}", request.email());
            throw new BadCredentialsException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        log.info("[Auth] Login successful: id={}, email={}", user.getId(), user.getEmail());
        return new AuthResponse(token, user.getId(), user.getEmail());
    }
}
