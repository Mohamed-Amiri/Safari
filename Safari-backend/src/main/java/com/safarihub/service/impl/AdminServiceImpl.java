package com.safarihub.service.impl;

import com.safarihub.dto.admin.StatsResponse;
import com.safarihub.dto.auth.UserResponse;
import com.safarihub.entity.ReservationStatus;
import com.safarihub.entity.Role;
import com.safarihub.entity.User;
import com.safarihub.exception.BadRequestException;
import com.safarihub.exception.ResourceNotFoundException;
import com.safarihub.mapper.UserMapper;
import com.safarihub.repository.FavoriteRepository;
import com.safarihub.repository.ReservationRepository;
import com.safarihub.repository.ReviewRepository;
import com.safarihub.repository.TripRepository;
import com.safarihub.repository.UserRepository;
import com.safarihub.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final ReservationRepository reservationRepository;
    private final ReviewRepository reviewRepository;
    private final FavoriteRepository favoriteRepository;
    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void promoteUserToAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", String.valueOf(userId)));

        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("User is already an admin");
        }

        user.setRole(Role.ADMIN);
        userRepository.save(user);
        log.info("User promoted to ADMIN: id={}, email={}", user.getId(), user.getEmail());
    }

    @Override
    @Transactional
    public void deleteUser(Long userId, Long currentUserId) {
        if (userId.equals(currentUserId)) {
            throw new BadRequestException("You cannot delete your own account");
        }
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", String.valueOf(userId));
        }
        userRepository.deleteById(userId);
        log.info("User deleted by admin: id={}", userId);
    }

    @Override
    @Transactional(readOnly = true)
    public StatsResponse getStatistics() {
        return StatsResponse.builder()
                .totalUsers(userRepository.countByRole(Role.USER))
                .totalAdmins(userRepository.countByRole(Role.ADMIN))
                .totalTrips(tripRepository.count())
                .totalReservations(reservationRepository.count())
                .activeReservations(reservationRepository.countByStatus(ReservationStatus.CONFIRMED))
                .totalReviews(reviewRepository.count())
                .totalFavorites(favoriteRepository.count())
                .build();
    }
}
