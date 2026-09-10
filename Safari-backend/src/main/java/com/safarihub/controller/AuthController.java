package com.safarihub.controller;

import com.safarihub.dto.auth.AuthResponse;
import com.safarihub.dto.auth.ChangePasswordRequest;
import com.safarihub.dto.auth.LoginRequest;
import com.safarihub.dto.auth.ProfileUpdateRequest;
import com.safarihub.dto.auth.RegisterRequest;
import com.safarihub.dto.auth.UserResponse;
import com.safarihub.dto.common.ApiResponse;
import com.safarihub.security.SecurityUserResolver;
import com.safarihub.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Authentication", description = "Register, login and manage profile")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final SecurityUserResolver securityUserResolver;

    @Operation(summary = "Register a new account (always ROLE_USER)")
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse data = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Account created successfully", data));
    }

    @Operation(summary = "Login and obtain a JWT")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse data = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @Operation(summary = "Get current authenticated user info")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> me() {
        String email = securityUserResolver.getCurrentEmail();
        UserResponse data = authService.getCurrentUser(email);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @Operation(summary = "Update first name, last name or email")
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        String email = securityUserResolver.getCurrentEmail();
        UserResponse data = authService.updateProfile(email, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated", data));
    }

    @Operation(summary = "Change password (requires current password)")
    @PatchMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        String email = securityUserResolver.getCurrentEmail();
        authService.changePassword(email, request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }
}
