package com.safarihub.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Formula;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * A bookable travel offering.
 */
@Entity
@Table(name = "trips")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = {"reservations", "reviews"})
public class Trip extends BaseEntity {

    @Column(nullable = false, length = 120)
    private String destination;

    @Column(length = 2000)
    private String description;

    @Column(length = 80)
    private String country;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "available_seats", nullable = false)
    private int availableSeats;

    @Column(name = "total_seats", nullable = false)
    private int totalSeats;

    @Column(name = "image_url", length = 600)
    private String imageUrl;

    @Column(length = 60)
    private String category;

    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Reservation> reservations = new ArrayList<>();

    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Review> reviews = new ArrayList<>();

    /** Average rating across all reviews for this trip (computed at query time). */
    @Formula("(SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.trip_id = id)")
    private double averageRating;

    /** Number of reviews for this trip (computed at query time). */
    @Formula("(SELECT COUNT(r.id) FROM reviews r WHERE r.trip_id = id)")
    private long reviewCount;
}
