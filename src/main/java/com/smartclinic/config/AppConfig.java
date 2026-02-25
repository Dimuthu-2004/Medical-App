package com.smartclinic.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * Application-level Spring beans that don't fit in any specific feature config.
 */
@Configuration
public class AppConfig {

    /** HTTP client for calling external REST APIs (e.g. RxNav). */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
