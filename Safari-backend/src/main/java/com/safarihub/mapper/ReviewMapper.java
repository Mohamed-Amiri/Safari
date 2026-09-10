package com.safarihub.mapper;

import com.safarihub.dto.review.ReviewResponse;
import com.safarihub.entity.Review;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface ReviewMapper {

    @Mapping(target = "tripId", source = "trip.id")
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userFullName", source = "user", qualifiedByName = "userFullName")
    ReviewResponse toResponse(Review review);

    @Named("userFullName")
    default String userFullName(com.safarihub.entity.User user) {
        return user == null ? null : user.getFullName();
    }
}
