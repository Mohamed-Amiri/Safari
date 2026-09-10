package com.safarihub.service;

import com.safarihub.dto.reservation.ReservationRequest;
import com.safarihub.dto.reservation.ReservationResponse;
import com.safarihub.entity.Reservation;
import com.safarihub.entity.ReservationStatus;
import com.safarihub.entity.Trip;
import com.safarihub.entity.User;
import com.safarihub.entity.Role;
import com.safarihub.exception.BadRequestException;
import com.safarihub.exception.ConflictException;
import com.safarihub.mapper.ReservationMapper;
import com.safarihub.repository.ReservationRepository;
import com.safarihub.repository.TripRepository;
import com.safarihub.repository.UserRepository;
import com.safarihub.service.impl.ReservationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock
    private ReservationRepository reservationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private TripRepository tripRepository;
    @Mock
    private ReservationMapper reservationMapper;

    @InjectMocks
    private ReservationServiceImpl reservationService;

    private User testUser;
    private Trip testTrip;
    private Reservation testReservation;
    private ReservationResponse testResponse;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("user@safarihub.com");
        testUser.setRole(Role.USER);

        testTrip = new Trip();
        testTrip.setId(10L);
        testTrip.setDestination("Marrakech");
        testTrip.setAvailableSeats(5);

        testReservation = new Reservation();
        testReservation.setId(100L);
        testReservation.setUser(testUser);
        testReservation.setTrip(testTrip);
        testReservation.setReservationDate(LocalDate.of(2026, 11, 10));
        testReservation.setStatus(ReservationStatus.CONFIRMED);

        testResponse = ReservationResponse.builder()
                .id(100L)
                .reservationDate(LocalDate.of(2026, 11, 10))
                .status("CONFIRMED")
                .build();
    }

    @Test
    void createReservation_success() {
        when(userRepository.findByEmail("user@safarihub.com")).thenReturn(Optional.of(testUser));
        when(tripRepository.findById(10L)).thenReturn(Optional.of(testTrip));
        when(reservationRepository.existsByUserIdAndTripIdAndStatus(1L, 10L, ReservationStatus.CONFIRMED))
                .thenReturn(false);
        when(reservationRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(tripRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(reservationMapper.toResponse(any(Reservation.class))).thenReturn(testResponse);

        ReservationResponse result = reservationService.createReservation(
                "user@safarihub.com", new ReservationRequest(10L, LocalDate.of(2026, 11, 10)));

        assertEquals("CONFIRMED", result.getStatus());
    }

    @Test
    void createReservation_duplicate_shouldThrowConflict() {
        when(userRepository.findByEmail("user@safarihub.com")).thenReturn(Optional.of(testUser));
        when(tripRepository.findById(10L)).thenReturn(Optional.of(testTrip));
        when(reservationRepository.existsByUserIdAndTripIdAndStatus(1L, 10L, ReservationStatus.CONFIRMED))
                .thenReturn(true);

        assertThrows(ConflictException.class,
                () -> reservationService.createReservation(
                        "user@safarihub.com", new ReservationRequest(10L, LocalDate.of(2026, 11, 10))));
    }

    @Test
    void createReservation_noSeats_shouldThrowBadRequest() {
        testTrip.setAvailableSeats(0);
        when(userRepository.findByEmail("user@safarihub.com")).thenReturn(Optional.of(testUser));
        when(tripRepository.findById(10L)).thenReturn(Optional.of(testTrip));

        assertThrows(BadRequestException.class,
                () -> reservationService.createReservation(
                        "user@safarihub.com", new ReservationRequest(10L, LocalDate.of(2026, 11, 10))));
    }

    @Test
    void cancelReservation_success() {
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(testReservation));
        when(reservationRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(tripRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(reservationMapper.toResponse(any(Reservation.class))).thenReturn(
                ReservationResponse.builder().id(100L).status("CANCELLED").build());

        ReservationResponse result = reservationService.cancelReservation(100L, "user@safarihub.com");

        assertEquals("CANCELLED", result.getStatus());
    }

    @Test
    void getMyReservations_shouldReturnList() {
        when(userRepository.findByEmail("user@safarihub.com")).thenReturn(Optional.of(testUser));
        when(reservationRepository.findAllByUserIdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(testReservation));
        when(reservationMapper.toResponse(any(Reservation.class))).thenReturn(testResponse);

        List<ReservationResponse> result = reservationService.getMyReservations("user@safarihub.com");
        assertEquals(1, result.size());
    }
}
