package com.safarihub.controller;

import com.safarihub.dto.common.ApiResponse;
import com.safarihub.dto.review.ReviewRequest;
import com.safarihub.dto.review.ReviewResponse;
import com.safarihub.security.SecurityUserResolver;
import com.safarihub.service.ReviewService;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Reviews", description = "Create, update, delete and read trip reviews")
@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final SecurityUserResolver securityUserResolver;

    @Operation(summary = "Read reviews for a trip")
    @GetMapping("/trip/{tripId}")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getReviewsByTrip(@PathVariable Long tripId) {
        List<ReviewResponse> data = reviewService.getReviewsByTrip(tripId);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @Operation(summary = "Create a review for a trip")
    @PostMapping
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(@Valid @RequestBody ReviewRequest request) {
        String email = securityUserResolver.getCurrentEmail();
        ReviewResponse data = reviewService.createReview(email, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Review created", data));
    }

    @Operation(summary = "Update your own review")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(@PathVariable Long id, @Valid @RequestBody ReviewRequest request) {
        String email = securityUserResolver.getCurrentEmail();
        ReviewResponse data = reviewService.updateReview(id, email, request);
        return ResponseEntity.ok(ApiResponse.success("Review updated", data));
    }

    @Operation(summary = "Delete your own review")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(@PathVariable Long id) {
        String email = securityUserResolver.getCurrentEmail();
        reviewService.deleteReview(id, email);
        return ResponseEntity.ok(ApiResponse.success("Review deleted", null));
    }
}
