package com.safarihub.service.impl;

import com.safarihub.dto.favorite.FavoriteRequest;
import com.safarihub.dto.favorite.FavoriteResponse;
import com.safarihub.entity.Favorite;
import com.safarihub.entity.Trip;
import com.safarihub.entity.User;
import com.safarihub.exception.BadRequestException;
import com.safarihub.exception.ConflictException;
import com.safarihub.exception.ResourceNotFoundException;
import com.safarihub.mapper.FavoriteMapper;
import com.safarihub.repository.FavoriteRepository;
import com.safarihub.repository.TripRepository;
import com.safarihub.repository.UserRepository;
import com.safarihub.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FavoriteServiceImpl implements FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final FavoriteMapper favoriteMapper;

    @Override
    @Transactional
    public FavoriteResponse addFavorite(String userEmail, FavoriteRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new BadRequestException("Authenticated user not found"));
        Trip trip = tripRepository.findById(request.getTripId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip", String.valueOf(request.getTripId())));

        if (favoriteRepository.existsByUserIdAndTripId(user.getId(), trip.getId())) {
            throw new ConflictException("This trip is already in your favorites");
        }

        Favorite favorite = new Favorite();
        favorite.setUser(user);
        favorite.setTrip(trip);
        favorite = favoriteRepository.save(favorite);

        log.info("Favorite added: user={}, trip={}", userEmail, trip.getDestination());
        return favoriteMapper.toResponse(favorite);
    }

    @Override
    @Transactional
    public void removeFavorite(Long id, String userEmail) {
        Favorite favorite = favoriteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Favorite", String.valueOf(id)));

        if (!favorite.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new BadRequestException("You can only remove your own favorites");
        }

        favoriteRepository.delete(favorite);
        log.info("Favorite removed: id={}, user={}", id, userEmail);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FavoriteResponse> getMyFavorites(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new BadRequestException("Authenticated user not found"));
        return favoriteRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(favoriteMapper::toResponse)
                .toList();
    }
}
