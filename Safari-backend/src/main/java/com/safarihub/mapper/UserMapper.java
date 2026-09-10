package com.safarihub.mapper;

import com.safarihub.dto.auth.UserResponse;
import com.safarihub.entity.Role;
import com.safarihub.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "fullName", source = "user", qualifiedByName = "fullName")
    @Mapping(target = "role", source = "user.role", qualifiedByName = "roleToString")
    UserResponse toResponse(User user);

    @Named("fullName")
    default String fullName(User user) {
        return user == null ? null : user.getFullName();
    }

    @Named("roleToString")
    default String roleToString(Role role) {
        return role == null ? null : "ROLE_" + role.name();
    }
}
