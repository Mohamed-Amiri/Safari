package com.safarihub.dto.reservation;

import com.safarihub.dto.auth.UserResponse;
import com.safarihub.dto.trip.TripResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationResponse {

    private Long id;
    private UserResponse user;
    private TripResponse trip;
    private LocalDate reservationDate;
    private String status;
    private LocalDateTime createdAt;
}
