package com.safarihub.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatsResponse {

    private long totalUsers;
    private long totalAdmins;
    private long totalTrips;
    private long totalReservations;
    private long activeReservations;
    private long totalReviews;
    private long totalFavorites;
}
