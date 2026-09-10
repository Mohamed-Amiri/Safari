package com.safarihub.controller;

import com.safarihub.dto.common.ApiResponse;
import com.safarihub.dto.common.PagedResponse;
import com.safarihub.dto.trip.TripRequest;
import com.safarihub.dto.trip.TripResponse;
import com.safarihub.service.TripService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@Tag(name = "Trips", description = "Browse, search and manage trips")
@RestController
@RequestMapping("/api/v1/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @Operation(summary = "Search / filter / paginate trips (public)")
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<TripResponse>>> searchTrips(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<TripResponse> data = tripService.searchTrips(
                keyword, destination, country, category, minPrice, maxPrice, pageable);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @Operation(summary = "Get a single trip by id")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TripResponse>> getTrip(@PathVariable Long id) {
        TripResponse data = tripService.getTripById(id);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @Operation(summary = "Create a new trip (ADMIN only)")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<TripResponse>> createTrip(@Valid @RequestBody TripRequest request) {
        TripResponse data = tripService.createTrip(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Trip created", data));
    }

    @Operation(summary = "Update an existing trip (ADMIN only)")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TripResponse>> updateTrip(@PathVariable Long id, @Valid @RequestBody TripRequest request) {
        TripResponse data = tripService.updateTrip(id, request);
        return ResponseEntity.ok(ApiResponse.success("Trip updated", data));
    }

    @Operation(summary = "Delete a trip (ADMIN only)")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTrip(@PathVariable Long id) {
        tripService.deleteTrip(id);
        return ResponseEntity.ok(ApiResponse.success("Trip deleted", null));
    }
}
