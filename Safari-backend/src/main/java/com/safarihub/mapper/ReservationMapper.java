package com.safarihub.mapper;

import com.safarihub.dto.reservation.ReservationResponse;
import com.safarihub.entity.Reservation;
import com.safarihub.entity.ReservationStatus;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring", uses = {UserMapper.class, TripMapper.class})
public interface ReservationMapper {

    @Mapping(target = "status", source = "status", qualifiedByName = "statusToString")
    ReservationResponse toResponse(Reservation reservation);

    @Named("statusToString")
    default String statusToString(ReservationStatus status) {
        return status == null ? null : status.name();
    }
}
