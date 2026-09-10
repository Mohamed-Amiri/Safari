package com.safarihub.entity;

/**
 * Application roles. The {@code ROLE_} prefix is added by the security layer
 * when building Spring Security authorities, so the stored value is the bare name.
 */
public enum Role {
    USER,
    ADMIN
}
