package com.safarihub.service;

import com.safarihub.dto.reservation.ReservationRequest;
import com.safarihub.dto.reservation.ReservationResponse;

import java.util.List;

public interface ReservationService {

    ReservationResponse createReservation(String userEmail, ReservationRequest request);

    ReservationResponse cancelReservation(Long id, String userEmail);

    List<ReservationResponse> getMyReservations(String userEmail);
}
