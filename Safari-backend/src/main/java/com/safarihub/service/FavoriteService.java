package com.safarihub.service;

import com.safarihub.dto.favorite.FavoriteRequest;
import com.safarihub.dto.favorite.FavoriteResponse;

import java.util.List;

public interface FavoriteService {

    FavoriteResponse addFavorite(String userEmail, FavoriteRequest request);

    void removeFavorite(Long id, String userEmail);

    List<FavoriteResponse> getMyFavorites(String userEmail);
}
