package com.smartclinic.controller;

import com.smartclinic.dto.DoctorRegisterRequest;
import com.smartclinic.dto.PatientRegisterRequest;
import com.smartclinic.dto.StaffRegisterRequest;
import com.smartclinic.service.AuthService;
import com.smartclinic.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthRestController {

    private final AuthService authService;
    private final EmailService emailService;

    @GetMapping("/user")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        Map<String, Object> userData = new HashMap<>();
        userData.put("username", authentication.getName());
        userData.put("roles", authentication.getAuthorities());
        return ResponseEntity.ok(userData);
    }

    @PostMapping("/register/patient")
    public ResponseEntity<?> registerPatient(@RequestBody PatientRegisterRequest request) {
        if (!request.getUser().getPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Passwords do not match"));
        }
        try {
            authService.registerPatient(request.getUser(), request.getPatient());

            // Send email (optional for API, but keeping consistency)
            try {
                org.thymeleaf.context.Context context = new org.thymeleaf.context.Context();
                context.setVariable("name", request.getPatient().getName());
                context.setVariable("role", "PATIENT");
                emailService.sendHtmlEmail(
                        request.getPatient().getEmail() != null ? request.getPatient().getEmail()
                                : request.getUser().getUsername(),
                        "Welcome to SmartClinic", "welcome", context);
            } catch (Exception e) {
                // Email failure shouldn't break registration
                System.err.println("AUTH REST: Welcome email failed for " + request.getPatient().getEmail());
                e.printStackTrace();
            }

            return ResponseEntity.ok(Map.of("message", "Registration successful"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/register/doctor")
    public ResponseEntity<?> registerDoctor(@RequestBody DoctorRegisterRequest request) {
        if (!request.getUser().getPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Passwords do not match"));
        }
        try {
            authService.registerDoctor(request.getUser(), request.getDoctorProfile());
            return ResponseEntity.ok(Map.of("message", "Registration successful"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/register/staff")
    public ResponseEntity<?> registerStaff(@RequestBody StaffRegisterRequest request) {
        if (!request.getUser().getPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Passwords do not match"));
        }
        try {
            authService.registerStaff(request.getUser(), request.getStaffProfile());

            try {
                org.thymeleaf.context.Context context = new org.thymeleaf.context.Context();
                context.setVariable("name", request.getStaffProfile().getFullName());
                context.setVariable("role", "STAFF (" + request.getStaffProfile().getJobRole() + ")");
                emailService.sendHtmlEmail(
                        request.getStaffProfile().getEmail() != null ? request.getStaffProfile().getEmail()
                                : request.getUser().getUsername(),
                        "Welcome to SmartClinic", "welcome", context);
            } catch (Exception e) {
                System.err.println("AUTH REST: Welcome email failed for staff");
            }

            return ResponseEntity.ok(Map.of("message", "Registration successful"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
