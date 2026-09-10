package com.safarihub.service;

import com.safarihub.dto.common.PagedResponse;
import com.safarihub.dto.trip.TripRequest;
import com.safarihub.dto.trip.TripResponse;
import com.safarihub.entity.Trip;
import com.safarihub.mapper.TripMapper;
import com.safarihub.repository.TripRepository;
import com.safarihub.service.impl.TripServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TripServiceTest {

    @Mock
    private TripRepository tripRepository;
    @Mock
    private TripMapper tripMapper;

    @InjectMocks
    private TripServiceImpl tripService;

    private Trip testTrip;
    private TripResponse testResponse;

    @BeforeEach
    void setUp() {
        testTrip = new Trip();
        testTrip.setId(1L);
        testTrip.setDestination("Paris");
        testTrip.setPrice(new BigDecimal("500.00"));
        testTrip.setTotalSeats(30);
        testTrip.setAvailableSeats(30);

        testResponse = TripResponse.builder()
                .id(1L)
                .destination("Paris")
                .price(new BigDecimal("500.00"))
                .availableSeats(30)
                .totalSeats(30)
                .build();
    }

    @Test
    void searchTrips_withNoFilters_shouldReturnAllTrips() {
        Page<Trip> page = new PageImpl<>(List.of(testTrip));
        when(tripRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        when(tripMapper.toResponse(testTrip)).thenReturn(testResponse);

        PagedResponse<TripResponse> result = tripService.searchTrips(
                null, null, null, null, null, null, Pageable.unpaged());

        assertEquals(1, result.getContent().size());
        assertEquals("Paris", result.getContent().get(0).getDestination());
    }

    @Test
    void getTripById_whenExists_shouldReturnTrip() {
        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(tripMapper.toResponse(testTrip)).thenReturn(testResponse);

        TripResponse result = tripService.getTripById(1L);

        assertEquals("Paris", result.getDestination());
    }

    @Test
    void getTripById_whenNotExists_shouldThrow() {
        when(tripRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(com.safarihub.exception.ResourceNotFoundException.class,
                () -> tripService.getTripById(999L));
    }

    @Test
    void createTrip_shouldSaveAndReturn() {
        TripRequest request = TripRequest.builder()
                .destination("Tokyo")
                .price(new BigDecimal("1200.00"))
                .totalSeats(20)
                .build();
        when(tripMapper.toEntity(request)).thenReturn(testTrip);
        when(tripRepository.save(any(Trip.class))).thenAnswer(i -> i.getArgument(0));
        when(tripMapper.toResponse(any(Trip.class))).thenReturn(testResponse);

        TripResponse result = tripService.createTrip(request);

        assertNotNull(result);
    }
}
