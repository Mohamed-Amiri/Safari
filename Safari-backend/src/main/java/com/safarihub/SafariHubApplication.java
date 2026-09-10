package com.safarihub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class SafariHubApplication {

    public static void main(String[] args) {
        SpringApplication.run(SafariHubApplication.class, args);
    }
}
