package com.safarihub.service;

import com.safarihub.dto.admin.StatsResponse;
import com.safarihub.dto.auth.UserResponse;

import java.util.List;

public interface AdminService {

    List<UserResponse> getAllUsers();

    void promoteUserToAdmin(Long userId);

    void deleteUser(Long userId, Long currentUserId);

    StatsResponse getStatistics();
}
