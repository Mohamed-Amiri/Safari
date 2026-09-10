package com.safarihub.service;

import com.safarihub.dto.common.PagedResponse;
import com.safarihub.dto.trip.TripRequest;
import com.safarihub.dto.trip.TripResponse;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface TripService {

    PagedResponse<TripResponse> searchTrips(String keyword, String destination,
                                              String country, String category,
                                              BigDecimal minPrice, BigDecimal maxPrice,
                                              Pageable pageable);

    TripResponse getTripById(Long id);

    TripResponse createTrip(TripRequest request);

    TripResponse updateTrip(Long id, TripRequest request);

    void deleteTrip(Long id);
}
