package com.smartclinic.config;

import com.smartclinic.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.AuthenticatedPrincipalOAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.InMemoryOAuth2AuthorizedClientService;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import jakarta.annotation.PostConstruct;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Configuration
@EnableWebSecurity
@org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

        private final CustomUserDetailsService userDetailsService;
        private final CustomAuthenticationSuccessHandler successHandler;
        private final com.smartclinic.service.CustomOAuth2UserService oAuth2UserService;
        private final com.smartclinic.service.CustomOidcUserService oidcUserService;
        private final PasswordEncoder passwordEncoder;
        private final Environment env;

        @PostConstruct
        void logOauthConfig() {
                String cid = env.getProperty("spring.security.oauth2.client.registration.google.client-id", "(missing)");
                String redir = env.getProperty("spring.security.oauth2.client.registration.google.redirect-uri", "(missing)");
                log.info("Google OAuth client id at startup: {}", cid);
                log.info("Google OAuth redirect uri at startup: {}", redir);
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(csrf -> csrf.disable())
                                // For XHR/API calls, return 401/403 instead of redirecting to /login
                                .exceptionHandling(ex -> ex
                                                .defaultAuthenticationEntryPointFor(
                                                                (request, response, authException) -> {
                                                                        response.setStatus(401);
                                                                        response.setContentType("application/json");
                                                                        response.getWriter().write(
                                                                                        "{\"error\":\"Unauthorized\"}");
                                                                },
                                                                new AntPathRequestMatcher("/api/**"))
                                                .defaultAccessDeniedHandlerFor(
                                                                (request, response, accessDeniedException) -> {
                                                                        response.setStatus(403);
                                                                        response.setContentType("application/json");
                                                                        response.getWriter().write(
                                                                                        "{\"error\":\"Forbidden\"}");
                                                                },
                                                                new AntPathRequestMatcher("/api/**")))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers("/", "/css/**", "/js/**", "/images/**", "/webjars/**",
                                                                "/bg.png", "/assets/**",
                                                                "/vite.svg")
                                                .permitAll()
                                                .requestMatchers("/register/**", "/login", "/forgot-password",
                                                                "/index.html")
                                                .permitAll()
                                                .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                                                .requestMatchers("/auth/google", "/auth/post-login").permitAll()
                                                .requestMatchers("/api/auth/**").permitAll() // Allow new API auth
                                                                                             // endpoints
                                                .requestMatchers("/api/debug/**").permitAll() // Debug endpoints
                                                .requestMatchers("/api/chat/**").permitAll()
                                                .requestMatchers("/api/drugs/suggest").authenticated() // Drug
                                                                                                       // autocomplete
                                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/api/patients/**").hasRole("PATIENT")
                                                .requestMatchers("/api/doctor/**").hasAnyRole("DOCTOR", "ADMIN")
                                                .requestMatchers("/api/appointments/doctors", "/api/appointments/sessions")
                                                .permitAll()
                                                .requestMatchers("/api/appointments/**").authenticated()
                                                .requestMatchers("/api/feedback/public").permitAll()
                                                .requestMatchers("/api/feedback/**").authenticated()
                                                .requestMatchers("/api/vitals/**")
                                                .hasAnyRole("DOCTOR", "ADMIN", "PATIENT")
                                                .requestMatchers("/api/medical-records/**")
                                                .hasAnyRole("DOCTOR", "ADMIN", "PATIENT")
                                                // Public utility: allow anyone to try OCR from the landing page.
                                                .requestMatchers("/api/ai/ocr/**").permitAll()
                                                // Public utility: allow anyone to try the symptom analyzer before visiting.
                                                .requestMatchers("/api/ai/symptoms/**").permitAll()
                                                // Finance: patients can view their own bill + upload/view slips.
                                                // Finance managers can manage the full finance dashboard.
                                                .requestMatchers("/api/finance/bill/**", "/api/finance/upload-slip",
                                                                "/api/finance/slips/**")
                                                .hasAnyRole("FINANCE_MANAGER", "PATIENT")
                                                .requestMatchers("/api/finance/**")
                                                .hasRole("FINANCE_MANAGER")
                                                .requestMatchers("/api/payment/**").authenticated()
                                                .requestMatchers("/api/pharmacy/**").hasRole("PHARMACIST")
                                                .requestMatchers("/payment/success", "/payment/cancel",
                                                                "/payment/upload-slip")
                                                .authenticated()
                                                .requestMatchers("/finance/bill/**")
                                                .authenticated()
                                                .requestMatchers("/finance/dashboard", "/finance/update-payment",
                                                                "/finance/verify-slip",
                                                                "/finance/slips/**")
                                                .hasRole("FINANCE_MANAGER")
                                                .requestMatchers("/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/doctor/**").hasAnyRole("DOCTOR", "ADMIN")
                                                .requestMatchers("/staff/**")
                                                .hasRole("NURSE")
                                                .requestMatchers("/pharmacy/**")
                                                .hasRole("PHARMACIST")
                                                .requestMatchers("/ai/symptoms/**").permitAll()
                                                .requestMatchers("/skin-scan").permitAll()
                                                .requestMatchers("/ai/interactions/**").hasRole("DOCTOR")
                                                .requestMatchers("/medical-records/**", "/vitals/**",
                                                                "/consultations/**")
                                                .hasAnyRole("DOCTOR", "ADMIN", "PATIENT")
                                                .requestMatchers("/patients/**", "/appointments/**", "/feedback/**")
                                                .authenticated()
                                                .requestMatchers("/ocr").permitAll()
                                                .anyRequest().authenticated())

                                .formLogin(form -> form
                                                .loginPage("/login")
                                                .successHandler(successHandler)
                                                .permitAll())
                                .oauth2Login(oauth -> oauth
                                                .loginPage("/login")
                                                .userInfoEndpoint(user -> user
                                                                .userService(oAuth2UserService)
                                                                .oidcUserService(oidcUserService))
                                                .successHandler(successHandler)
                                                .failureHandler(oauthFailureHandler()))
                                .logout(logout -> logout
                                                .logoutRequestMatcher(new AntPathRequestMatcher("/logout", "GET"))
                                                .logoutSuccessUrl("/")
                                                .permitAll());

                return http.build();
        }

        @Bean
        public ClientRegistrationRepository clientRegistrationRepository() {
                String clientId = env.getProperty("spring.security.oauth2.client.registration.google.client-id",
                                "657200415157-nhf4fi7t287lipkrnutp7brdunqn5jb9.apps.googleusercontent.com");
                String clientSecret = env.getProperty("spring.security.oauth2.client.registration.google.client-secret",
                                "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");
                String redirectUri = env.getProperty("spring.security.oauth2.client.registration.google.redirect-uri",
                                "{baseUrl}/login/oauth2/code/{registrationId}");

                ClientRegistration google = ClientRegistration.withRegistrationId("google")
                                .clientId(clientId)
                                .clientSecret(clientSecret)
                                .clientAuthenticationMethod(
                                                org.springframework.security.oauth2.core.ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                                .redirectUri(redirectUri)
                                .scope("openid", "profile", "email")
                                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                                .tokenUri("https://oauth2.googleapis.com/token")
                                .jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
                                .issuerUri("https://accounts.google.com")
                                .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
                                .userNameAttributeName("sub")
                                .clientName("Google")
                                .build();

                return new InMemoryClientRegistrationRepository(google);
        }

        @Bean
        public AuthenticationProvider authenticationProvider() {
                DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
                provider.setUserDetailsService(userDetailsService);
                provider.setPasswordEncoder(passwordEncoder);
                return provider;
        }

        @Bean
        public OAuth2AuthorizedClientService authorizedClientService(ClientRegistrationRepository repo) {
                return new InMemoryOAuth2AuthorizedClientService(repo);
        }

        @Bean
        public OAuth2AuthorizedClientRepository authorizedClientRepository(OAuth2AuthorizedClientService service) {
                return new AuthenticatedPrincipalOAuth2AuthorizedClientRepository(service);
        }

        @Bean
        public AuthenticationFailureHandler oauthFailureHandler() {
                return (request, response, exception) -> {
                        log.error("OAuth2 login failed: {}", exception.getMessage());
                        String reason = exception.getClass().getSimpleName()
                                        + ":" + (exception.getMessage() == null ? "" : exception.getMessage());
                        response.sendRedirect("/login?oauthError="
                                        + URLEncoder.encode(reason, StandardCharsets.UTF_8));
                };
        }
}
