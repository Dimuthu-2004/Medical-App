package com.smartclinic.service;

import com.smartclinic.model.User;
import com.smartclinic.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        String role = user.getRole() == null ? "" : user.getRole().trim().toUpperCase();
        if (role.startsWith("ROLE_")) {
            role = role.substring(5);
        }
        // Normalize common legacy labels into the app's supported roles.
        // This keeps older DB rows usable after tightening role support.
        role = role.replace(' ', '_');
        switch (role) {
            case "PAYMENT_MANAGER" -> role = "FINANCE_MANAGER";
            case "STAFF", "RECEPTIONIST", "LAB", "LAB_TECH", "LABORATORY" -> role = "NURSE";
            default -> {
            }
        }

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword()) // Password should be encoded in DB
                .roles(role)
                .build();
    }
}
