package com.safarihub.dto.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse {

    private Long id;
    private Long tripId;
    private Long userId;
    private String userFullName;
    private int rating;
    private String comment;
    private LocalDateTime createdAt;
}
