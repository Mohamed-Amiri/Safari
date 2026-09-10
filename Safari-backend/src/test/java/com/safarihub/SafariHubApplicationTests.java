package com.safarihub;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

/**
 * Smoke test that boots the full Spring context.
 *
 * <p>Only runs when a {@code CI} environment variable equals {@code true}, because it requires a
 * live MySQL instance (configured in {@code application.properties}). The pure unit tests under
 * {@code com.safarihub.service} run without a database and cover the business logic.
 *
 * <p>To run this locally: start MySQL, create the {@code TravelFlow} database, then export
 * {@code CI=true}.
 */
@EnabledIfEnvironmentVariable(named = "CI", matches = "true")
class SafariHubApplicationTests {

    @Test
    void contextLoads() {
    }
}
