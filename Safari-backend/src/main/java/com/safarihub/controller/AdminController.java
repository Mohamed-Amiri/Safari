package com.safarihub.controller;

import com.safarihub.dto.admin.StatsResponse;
import com.safarihub.dto.auth.UserResponse;
import com.safarihub.dto.common.ApiResponse;
import com.safarihub.security.SecurityUserResolver;
import com.safarihub.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Admin", description = "Platform administration endpoints (ADMIN only)")
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final SecurityUserResolver securityUserResolver;

    @Operation(summary = "List all users")
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> data = adminService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @Operation(summary = "Promote a user to ADMIN")
    @PutMapping("/users/{id}/promote")
    public ResponseEntity<ApiResponse<Void>> promoteUser(@PathVariable Long id) {
        adminService.promoteUserToAdmin(id);
        return ResponseEntity.ok(ApiResponse.success("User promoted to ADMIN", null));
    }

    @Operation(summary = "Delete a user")
    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        Long currentUserId = securityUserResolver.getCurrentUser().getId();
        adminService.deleteUser(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("User deleted", null));
    }

    @Operation(summary = "Get platform statistics")
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<StatsResponse>> getStats() {
        StatsResponse data = adminService.getStatistics();
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
