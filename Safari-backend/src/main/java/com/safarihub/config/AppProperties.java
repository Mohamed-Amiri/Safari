package com.safarihub.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Admin admin = new Admin();

    private String corsAllowedOrigins = "http://localhost:4200,http://localhost:3000";

    @Getter
    @Setter
    public static class Admin {
        private String email = "admin@safarihub.com";
        private String password = "Admin@123";
        private String firstName = "SafariHub";
        private String lastName = "Administrator";
    }
}
