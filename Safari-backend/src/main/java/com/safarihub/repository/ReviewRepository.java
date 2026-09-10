package com.safarihub.repository;

import com.safarihub.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findAllByTripIdOrderByCreatedAtDesc(Long tripId);

    Optional<Review> findByUserIdAndTripId(Long userId, Long tripId);

    boolean existsByUserIdAndTripId(Long userId, Long tripId);
}
