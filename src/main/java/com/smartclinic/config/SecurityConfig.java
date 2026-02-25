package com.smartclinic.config;

import com.smartclinic.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
@EnableWebSecurity
@org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final CustomUserDetailsService userDetailsService;
        private final CustomAuthenticationSuccessHandler successHandler;

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(csrf -> csrf.ignoringRequestMatchers("/api/**", "/login", "/logout",
                                                "/forgot-password", "/register/**", "/patients/api/**",
                                                "/api/vitals/**")) // Disable
                                // CSRF for
                                // API and
                                // React
                                // form
                                // login
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers("/", "/css/**", "/js/**", "/images/**", "/webjars/**",
                                                                "/bg.png", "/assets/**",
                                                                "/vite.svg")
                                                .permitAll()
                                                .requestMatchers("/register/**", "/login", "/forgot-password",
                                                                "/index.html")
                                                .permitAll()
                                                .requestMatchers("/api/auth/**").permitAll() // Allow new API auth
                                                                                             // endpoints
                                                .requestMatchers("/api/debug/**").permitAll() // Debug endpoints
                                                .requestMatchers("/api/drugs/suggest").authenticated() // Drug
                                                                                                       // autocomplete
                                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/api/patients/**").hasRole("PATIENT")
                                                .requestMatchers("/api/doctor/**").hasAnyRole("DOCTOR", "ADMIN")
                                                .requestMatchers("/api/appointments/**").authenticated()
                                                .requestMatchers("/api/feedback/**").authenticated()
                                                .requestMatchers("/api/vitals/**")
                                                .hasAnyRole("DOCTOR", "ADMIN", "PATIENT")
                                                .requestMatchers("/api/medical-records/**")
                                                .hasAnyRole("DOCTOR", "ADMIN", "PATIENT")
                                                .requestMatchers("/api/finance/slips/**")
                                                .hasAnyRole("PAYMENT_MANAGER", "ADMIN", "PATIENT")
                                                .requestMatchers("/api/finance/**")
                                                .hasAnyRole("PAYMENT_MANAGER", "ADMIN")
                                                .requestMatchers("/payment/success", "/payment/cancel",
                                                                "/payment/upload-slip")
                                                .authenticated()
                                                .requestMatchers("/finance/bill/**").authenticated()
                                                .requestMatchers("/finance/dashboard", "/finance/update-payment",
                                                                "/finance/verify-slip",
                                                                "/finance/slips/**")
                                                .hasAnyRole("PAYMENT_MANAGER", "ADMIN")
                                                .requestMatchers("/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/doctor/**").hasAnyRole("DOCTOR", "ADMIN")
                                                .requestMatchers("/staff/**")
                                                .hasAnyRole("RECEPTIONIST", "NURSE", "ADMIN")
                                                .requestMatchers("/ai/symptoms/**").hasAnyRole("PATIENT", "DOCTOR")
                                                .requestMatchers("/ai/interactions/**").hasRole("DOCTOR")
                                                .requestMatchers("/medical-records/**", "/vitals/**",
                                                                "/consultations/**")
                                                .hasAnyRole("DOCTOR", "ADMIN", "PATIENT")
                                                .requestMatchers("/patients/**", "/appointments/**", "/feedback/**")
                                                .authenticated()
                                                .anyRequest().authenticated())

                                .formLogin(form -> form
                                                .loginPage("/login")
                                                .successHandler(successHandler)
                                                .permitAll())
                                .logout(logout -> logout
                                                .logoutRequestMatcher(new AntPathRequestMatcher("/logout", "GET"))
                                                .logoutSuccessUrl("/login?logout")
                                                .permitAll());

                return http.build();
        }

        @Bean
        public AuthenticationProvider authenticationProvider() {
                DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
                provider.setUserDetailsService(userDetailsService);
                provider.setPasswordEncoder(passwordEncoder());
                return provider;
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                // For simplicity as requested (and consistent with previous "noop"), using
                // NoOp.
                // In real app, use BCryptPasswordEncoder.
                return NoOpPasswordEncoder.getInstance();
        }
}
