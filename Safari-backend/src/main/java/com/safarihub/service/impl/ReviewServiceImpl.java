package com.safarihub.service.impl;

import com.safarihub.dto.review.ReviewRequest;
import com.safarihub.dto.review.ReviewResponse;
import com.safarihub.entity.Review;
import com.safarihub.entity.Trip;
import com.safarihub.entity.User;
import com.safarihub.exception.BadRequestException;
import com.safarihub.exception.ConflictException;
import com.safarihub.exception.ResourceNotFoundException;
import com.safarihub.mapper.ReviewMapper;
import com.safarihub.repository.ReviewRepository;
import com.safarihub.repository.TripRepository;
import com.safarihub.repository.UserRepository;
import com.safarihub.service.ReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final ReviewMapper reviewMapper;

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByTrip(Long tripId) {
        if (!tripRepository.existsById(tripId)) {
            throw new ResourceNotFoundException("Trip", String.valueOf(tripId));
        }
        return reviewRepository.findAllByTripIdOrderByCreatedAtDesc(tripId).stream()
                .map(reviewMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public ReviewResponse createReview(String userEmail, ReviewRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new BadRequestException("Authenticated user not found"));
        Trip trip = tripRepository.findById(request.getTripId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip", String.valueOf(request.getTripId())));

        if (reviewRepository.existsByUserIdAndTripId(user.getId(), trip.getId())) {
            throw new ConflictException("You already reviewed this trip");
        }

        Review review = new Review();
        review.setUser(user);
        review.setTrip(trip);
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review = reviewRepository.save(review);

        log.info("Review created: id={}, user={}, trip={}", review.getId(), userEmail, trip.getDestination());
        return reviewMapper.toResponse(review);
    }

    @Override
    @Transactional
    public ReviewResponse updateReview(Long id, String userEmail, ReviewRequest request) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review", String.valueOf(id)));

        if (!review.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new BadRequestException("You can only update your own reviews");
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review = reviewRepository.save(review);

        log.info("Review updated: id={}, user={}", id, userEmail);
        return reviewMapper.toResponse(review);
    }

    @Override
    @Transactional
    public void deleteReview(Long id, String userEmail) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review", String.valueOf(id)));

        if (!review.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new BadRequestException("You can only delete your own reviews");
        }

        reviewRepository.delete(review);
        log.info("Review deleted: id={}, user={}", id, userEmail);
    }
}
