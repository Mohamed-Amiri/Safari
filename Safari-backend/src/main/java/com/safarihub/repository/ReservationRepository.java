package com.safarihub.repository;

import com.safarihub.entity.Reservation;
import com.safarihub.entity.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    /** Active (non-cancelled) reservation for a user + trip, if any. */
    Optional<Reservation> findByUserIdAndTripIdAndStatus(Long userId, Long tripId, ReservationStatus status);

    boolean existsByUserIdAndTripIdAndStatus(Long userId, Long tripId, ReservationStatus status);

    List<Reservation> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    long countByStatus(ReservationStatus status);

    long countByTripIdAndStatus(Long tripId, ReservationStatus status);
}
