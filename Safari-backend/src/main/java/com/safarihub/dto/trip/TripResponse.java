package com.safarihub.dto.trip;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripResponse {

    private Long id;
    private String destination;
    private String description;
    private String country;
    private BigDecimal price;
    private LocalDate startDate;
    private LocalDate endDate;
    private int availableSeats;
    private int totalSeats;
    private String imageUrl;
    private String category;
    private double averageRating;
    private long reviewCount;
    private LocalDateTime createdAt;
}
