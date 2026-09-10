package com.safarihub.service;

import com.safarihub.dto.review.ReviewRequest;
import com.safarihub.dto.review.ReviewResponse;

import java.util.List;

public interface ReviewService {

    List<ReviewResponse> getReviewsByTrip(Long tripId);

    ReviewResponse createReview(String userEmail, ReviewRequest request);

    ReviewResponse updateReview(Long id, String userEmail, ReviewRequest request);

    void deleteReview(Long id, String userEmail);
}
