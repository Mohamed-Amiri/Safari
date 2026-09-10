package com.safarihub.mapper;

import com.safarihub.dto.favorite.FavoriteResponse;
import com.safarihub.entity.Favorite;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", uses = {TripMapper.class})
public interface FavoriteMapper {

    FavoriteResponse toResponse(Favorite favorite);
}
