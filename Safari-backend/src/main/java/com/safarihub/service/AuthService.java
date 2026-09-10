package com.safarihub.service;

import com.safarihub.dto.auth.AuthResponse;
import com.safarihub.dto.auth.ChangePasswordRequest;
import com.safarihub.dto.auth.LoginRequest;
import com.safarihub.dto.auth.ProfileUpdateRequest;
import com.safarihub.dto.auth.RegisterRequest;
import com.safarihub.dto.auth.UserResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    UserResponse getCurrentUser(String email);

    UserResponse updateProfile(String email, ProfileUpdateRequest request);

    void changePassword(String email, ChangePasswordRequest request);
}
