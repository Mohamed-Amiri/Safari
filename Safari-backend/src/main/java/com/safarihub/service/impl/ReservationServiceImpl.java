package com.safarihub.service.impl;

import com.safarihub.dto.reservation.ReservationRequest;
import com.safarihub.dto.reservation.ReservationResponse;
import com.safarihub.entity.Reservation;
import com.safarihub.entity.ReservationStatus;
import com.safarihub.entity.Trip;
import com.safarihub.entity.User;
import com.safarihub.exception.BadRequestException;
import com.safarihub.exception.ConflictException;
import com.safarihub.exception.ResourceNotFoundException;
import com.safarihub.mapper.ReservationMapper;
import com.safarihub.repository.ReservationRepository;
import com.safarihub.repository.TripRepository;
import com.safarihub.repository.UserRepository;
import com.safarihub.service.ReservationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final ReservationMapper reservationMapper;

    @Override
    @Transactional
    public ReservationResponse createReservation(String userEmail, ReservationRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new BadRequestException("Authenticated user not found"));
        Trip trip = tripRepository.findById(request.getTripId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip", String.valueOf(request.getTripId())));

        if (reservationRepository.existsByUserIdAndTripIdAndStatus(
                user.getId(), trip.getId(), ReservationStatus.CONFIRMED)) {
            throw new ConflictException("You already have an active reservation for trip: " + trip.getDestination());
        }

        if (trip.getAvailableSeats() <= 0) {
            throw new BadRequestException("No seats available for trip: " + trip.getDestination());
        }

        Reservation reservation = new Reservation();
        reservation.setUser(user);
        reservation.setTrip(trip);
        reservation.setReservationDate(request.getReservationDate());
        reservation.setStatus(ReservationStatus.CONFIRMED);
        reservation = reservationRepository.save(reservation);

        trip.setAvailableSeats(trip.getAvailableSeats() - 1);
        tripRepository.save(trip);

        log.info("Reservation created: id={}, user={}, trip={}", reservation.getId(), userEmail, trip.getDestination());
        return reservationMapper.toResponse(reservation);
    }

    @Override
    @Transactional
    public ReservationResponse cancelReservation(Long id, String userEmail) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", String.valueOf(id)));

        if (!reservation.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new BadRequestException("You can only cancel your own reservations");
        }

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new BadRequestException("Reservation is already cancelled");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation = reservationRepository.save(reservation);

        Trip trip = reservation.getTrip();
        trip.setAvailableSeats(trip.getAvailableSeats() + 1);
        tripRepository.save(trip);

        log.info("Reservation cancelled: id={}, user={}", id, userEmail);
        return reservationMapper.toResponse(reservation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponse> getMyReservations(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new BadRequestException("Authenticated user not found"));
        return reservationRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(reservationMapper::toResponse)
                .toList();
    }
}
