package com.safarihub.controller;

import com.safarihub.dto.common.ApiResponse;
import com.safarihub.dto.reservation.ReservationRequest;
import com.safarihub.dto.reservation.ReservationResponse;
import com.safarihub.security.SecurityUserResolver;
import com.safarihub.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Reservations", description = "Book trips, cancel and view your reservations")
@RestController
@RequestMapping("/api/v1/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;
    private final SecurityUserResolver securityUserResolver;

    @Operation(summary = "Book a trip")
    @PostMapping
    public ResponseEntity<ApiResponse<ReservationResponse>> createReservation(@Valid @RequestBody ReservationRequest request) {
        String email = securityUserResolver.getCurrentEmail();
        ReservationResponse data = reservationService.createReservation(email, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Reservation created", data));
    }

    @Operation(summary = "Cancel a reservation")
    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<ReservationResponse>> cancelReservation(@PathVariable Long id) {
        String email = securityUserResolver.getCurrentEmail();
        ReservationResponse data = reservationService.cancelReservation(id, email);
        return ResponseEntity.ok(ApiResponse.success("Reservation cancelled", data));
    }

    @Operation(summary = "View all my reservations")
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> getMyReservations() {
        String email = securityUserResolver.getCurrentEmail();
        List<ReservationResponse> data = reservationService.getMyReservations(email);
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
