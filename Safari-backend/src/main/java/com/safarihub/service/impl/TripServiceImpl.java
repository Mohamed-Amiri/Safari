package com.safarihub.service.impl;

import com.safarihub.dto.common.PagedResponse;
import com.safarihub.dto.common.PaginationMeta;
import com.safarihub.dto.trip.TripRequest;
import com.safarihub.dto.trip.TripResponse;
import com.safarihub.entity.ReservationStatus;
import com.safarihub.entity.Trip;
import com.safarihub.exception.BadRequestException;
import com.safarihub.exception.ResourceNotFoundException;
import com.safarihub.mapper.TripMapper;
import com.safarihub.repository.ReservationRepository;
import com.safarihub.repository.TripRepository;
import com.safarihub.service.TripService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TripServiceImpl implements TripService {

    private final TripRepository tripRepository;
    private final ReservationRepository reservationRepository;
    private final TripMapper tripMapper;

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<TripResponse> searchTrips(String keyword, String destination,
                                                   String country, String category,
                                                   BigDecimal minPrice, BigDecimal maxPrice,
                                                   Pageable pageable) {
        Specification<Trip> spec = buildSpecification(keyword, destination, country,
                category, minPrice, maxPrice);
        Page<Trip> page = tripRepository.findAll(spec, pageable);

        List<TripResponse> content = page.getContent().stream()
                .map(tripMapper::toResponse)
                .toList();

        PaginationMeta meta = PaginationMeta.builder()
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();

        return PagedResponse.<TripResponse>builder()
                .content(content)
                .pagination(meta)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public TripResponse getTripById(Long id) {
        Trip trip = findOrThrow(id);
        return tripMapper.toResponse(trip);
    }

    @Override
    @Transactional
    public TripResponse createTrip(TripRequest request) {
        Trip trip = tripMapper.toEntity(request);
        if (trip.getAvailableSeats() == 0) {
            trip.setAvailableSeats(trip.getTotalSeats());
        }
        trip = tripRepository.save(trip);
        log.info("Trip created: id={}, destination={}", trip.getId(), trip.getDestination());
        return tripMapper.toResponse(trip);
    }

    @Override
    @Transactional
    public TripResponse updateTrip(Long id, TripRequest request) {
        Trip trip = findOrThrow(id);
        tripMapper.updateEntityFromRequest(request, trip);
        trip = tripRepository.save(trip);
        log.info("Trip updated: id={}", id);
        return tripMapper.toResponse(trip);
    }

    @Override
    @Transactional
    public void deleteTrip(Long id) {
        if (!tripRepository.existsById(id)) {
            throw new ResourceNotFoundException("Trip", String.valueOf(id));
        }

        if (reservationRepository.countByTripIdAndStatus(id, ReservationStatus.CONFIRMED) > 0) {
            throw new BadRequestException("Cannot delete trip with active reservations");
        }

        tripRepository.deleteById(id);
        log.info("Trip deleted: id={}", id);
    }

    private Trip findOrThrow(Long id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip", String.valueOf(id)));
    }

    private Specification<Trip> buildSpecification(String keyword, String destination,
                                                    String country, String category,
                                                    BigDecimal minPrice, BigDecimal maxPrice) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.toLowerCase() + "%";
                Predicate dest = cb.like(cb.lower(root.get("destination")), like);
                Predicate desc = cb.like(cb.lower(root.get("description")), like);
                Predicate cntry = cb.like(cb.lower(root.get("country")), like);
                predicates.add(cb.or(dest, desc, cntry));
            }
            if (destination != null && !destination.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("destination")),
                        "%" + destination.toLowerCase() + "%"));
            }
            if (country != null && !country.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("country")),
                        "%" + country.toLowerCase() + "%"));
            }
            if (category != null && !category.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("category")),
                        category.toLowerCase()));
            }
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
