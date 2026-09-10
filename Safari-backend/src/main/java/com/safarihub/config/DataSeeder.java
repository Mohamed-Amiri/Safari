package com.safarihub.config;

import com.safarihub.entity.Role;
import com.safarihub.entity.Trip;
import com.safarihub.entity.User;
import com.safarihub.repository.TripRepository;
import com.safarihub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties appProperties;

    @Override
    public void run(String... args) {
        seedAdmin();
        seedSampleTrips();
    }

    private void seedAdmin() {
        if (userRepository.existsByRole(Role.ADMIN)) {
            log.info("Admin user already exists — skipping seed.");
            return;
        }

        AppProperties.Admin cfg = appProperties.getAdmin();

        User admin = new User();
        admin.setFirstName(cfg.getFirstName());
        admin.setLastName(cfg.getLastName());
        admin.setEmail(cfg.getEmail());
        admin.setPassword(passwordEncoder.encode(cfg.getPassword()));
        admin.setRole(Role.ADMIN);

        userRepository.save(admin);
        log.info("Default ADMIN created: {}", cfg.getEmail());
    }

    private void seedSampleTrips() {
        if (tripRepository.count() > 0) {
            log.info("Trips already exist — skipping seed.");
            return;
        }

        tripRepository.saveAll(List.of(
                createTrip("Marrakech", "Explore the vibrant souks and palaces",
                        "Morocco", new BigDecimal("1999.00"),
                        LocalDate.of(2026, 11, 10), LocalDate.of(2026, 11, 17),
                        30, "https://images.unsplash.com/photo-1597212618440-806262de4f6b", "Cultural"),
                createTrip("Chefchaouen", "Discover the blue pearl of Morocco",
                        "Morocco", new BigDecimal("1499.00"),
                        LocalDate.of(2026, 12, 5), LocalDate.of(2026, 12, 10),
                        20, "https://images.unsplash.com/photo-1553264710-39a43864d851", "Adventure"),
                createTrip("Merzouga Desert", "Sahara desert camping under the stars",
                        "Morocco", new BigDecimal("2299.00"),
                        LocalDate.of(2027, 1, 20), LocalDate.of(2027, 1, 26),
                        15, "https://images.unsplash.com/photo-1489493887464-892be6d1daae", "Adventure"),
                createTrip("Fes", "Walk through the world's largest car-free urban area",
                        "Morocco", new BigDecimal("1799.00"),
                        LocalDate.of(2027, 3, 1), LocalDate.of(2027, 3, 6),
                        25, "https://images.unsplash.com/photo-1579019163242-e977f715c015", "Cultural"),
                createTrip("Essaouira", "Coastal getaway with windsurfing and medina visits",
                        "Morocco", new BigDecimal("1299.00"),
                        LocalDate.of(2027, 4, 15), LocalDate.of(2027, 4, 20),
                        40, "https://images.unsplash.com/photo-1548820515-5d79db908e5c", "Relaxation")
        ));

        log.info("Sample trips seeded.");
    }

    private Trip createTrip(String destination, String description, String country,
                             BigDecimal price, LocalDate startDate, LocalDate endDate,
                             int totalSeats, String imageUrl, String category) {
        Trip trip = new Trip();
        trip.setDestination(destination);
        trip.setDescription(description);
        trip.setCountry(country);
        trip.setPrice(price);
        trip.setStartDate(startDate);
        trip.setEndDate(endDate);
        trip.setTotalSeats(totalSeats);
        trip.setAvailableSeats(totalSeats);
        trip.setImageUrl(imageUrl);
        trip.setCategory(category);
        return trip;
    }
}
