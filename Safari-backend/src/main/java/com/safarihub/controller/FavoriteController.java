package com.safarihub.controller;

import com.safarihub.dto.common.ApiResponse;
import com.safarihub.dto.favorite.FavoriteRequest;
import com.safarihub.dto.favorite.FavoriteResponse;
import com.safarihub.security.SecurityUserResolver;
import com.safarihub.service.FavoriteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Favorites", description = "Save and manage favourite trips")
@RestController
@RequestMapping("/api/v1/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;
    private final SecurityUserResolver securityUserResolver;

    @Operation(summary = "Add a trip to favourites")
    @PostMapping
    public ResponseEntity<ApiResponse<FavoriteResponse>> addFavorite(@Valid @RequestBody FavoriteRequest request) {
        String email = securityUserResolver.getCurrentEmail();
        FavoriteResponse data = favoriteService.addFavorite(email, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Added to favourites", data));
    }

    @Operation(summary = "Remove a favourite")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> removeFavorite(@PathVariable Long id) {
        String email = securityUserResolver.getCurrentEmail();
        favoriteService.removeFavorite(id, email);
        return ResponseEntity.ok(ApiResponse.success("Removed from favourites", null));
    }

    @Operation(summary = "View all my favourites")
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<FavoriteResponse>>> getMyFavorites() {
        String email = securityUserResolver.getCurrentEmail();
        List<FavoriteResponse> data = favoriteService.getMyFavorites(email);
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
