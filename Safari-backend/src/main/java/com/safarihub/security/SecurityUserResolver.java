package com.safarihub.security;

import com.safarihub.entity.User;
import com.safarihub.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SecurityUserResolver {

    private final UserDetailsServiceImpl userDetailsService;

    public String getCurrentEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return (String) auth.getPrincipal();
    }

    public User getCurrentUser() {
        String email = getCurrentEmail();
        if (email == null) {
            throw new ResourceNotFoundException("No authenticated user in security context");
        }
        return userDetailsService.loadUserEntityByEmail(email);
    }
}
