package com.safarihub.mapper;

import com.safarihub.dto.trip.TripRequest;
import com.safarihub.dto.trip.TripResponse;
import com.safarihub.entity.Trip;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface TripMapper {

    TripResponse toResponse(Trip trip);

    Trip toEntity(TripRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromRequest(TripRequest request, @MappingTarget Trip trip);
}
