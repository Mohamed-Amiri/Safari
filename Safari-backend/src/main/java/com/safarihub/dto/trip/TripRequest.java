package com.safarihub.dto.trip;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripRequest {

    @NotBlank(message = "Destination is required")
    @Size(max = 120)
    private String destination;

    @Size(max = 2000)
    private String description;

    @Size(max = 80)
    private String country;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private BigDecimal price;

    @Future(message = "Start date must be in the future")
    private LocalDate startDate;

    @Future(message = "End date must be in the future")
    private LocalDate endDate;

    @NotNull(message = "Total seats is required")
    @Min(value = 1, message = "Total seats must be at least 1")
    private Integer totalSeats;

    @PositiveOrZero(message = "Available seats cannot be negative")
    private Integer availableSeats;

    @Size(max = 600)
    private String imageUrl;

    @Size(max = 60)
    private String category;

    /** Cross-field validation: end date must be after start date (when both are present). */
    @AssertTrue(message = "End date must be after start date")
    public boolean isValidDateRange() {
        return startDate == null || endDate == null || endDate.isAfter(startDate);
    }
}
