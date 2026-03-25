package com.smartclinic.controller;

import com.smartclinic.dto.DoctorRegisterRequest;
import com.smartclinic.dto.PatientRegisterRequest;
import com.smartclinic.dto.StaffRegisterRequest;
import com.smartclinic.model.User;
import com.smartclinic.repository.UserRepository;
import com.smartclinic.service.AuthService;
import com.smartclinic.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.thymeleaf.context.Context;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthRestController {

    private final AuthService authService;
    private final EmailService emailService;
    private final UserRepository userRepository;

    @GetMapping("/user")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        User user = userRepository.findByUsernameIgnoreCase(authentication.getName()).orElse(null);
        Map<String, Object> userData = new HashMap<>();
        userData.put("username", authentication.getName());
        userData.put("roles", authentication.getAuthorities());
        userData.put("principalType", authentication.getPrincipal() != null
                ? authentication.getPrincipal().getClass().getName()
                : null);
        String resolvedRole = authentication.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .filter(a -> a != null && a.startsWith("ROLE_") && !"ROLE_ANONYMOUS".equals(a))
                .map(a -> a.substring("ROLE_".length()))
                .findFirst()
                .orElse(null);
        if (user != null) {
            userData.put("role", user.getRole() == null ? resolvedRole : user.getRole());
            userData.put("authProvider", user.getAuthProvider() == null ? "PASSWORD" : user.getAuthProvider());
        } else if (resolvedRole != null) {
            userData.put("role", resolvedRole);
        }
        return ResponseEntity.ok(userData);
    }

    @PostMapping("/register/patient")
    public ResponseEntity<?> registerPatient(@RequestBody PatientRegisterRequest request) {
        System.out.println("AUTH REST: Registering PATIENT: " + request.getUser().getUsername());
        String passwordMatchError = validatePasswordMatch(request.getUser(), request.getConfirmPassword());
        if (passwordMatchError != null) {
            return ResponseEntity.badRequest().body(Map.of("error", passwordMatchError));
        }
        try {
            authService.registerPatient(request.getUser(), request.getPatient());

            // Send Welcome Email
            try {
                String recipientEmail = request.getPatient().getEmail();
                if (recipientEmail == null || recipientEmail.trim().isEmpty()) {
                    recipientEmail = request.getUser().getUsername();
                }

                Context context = new Context();
                context.setVariable("name", request.getPatient().getName());
                context.setVariable("role", "PATIENT");
                emailService.sendHtmlEmail(recipientEmail, "Welcome to SmartClinic", "welcome", context);
            } catch (Exception e) {
                System.err.println("AUTH REST: Welcome email failed for patient (" + request.getUser().getUsername()
                        + "): " + e.getMessage());
                e.printStackTrace();
            }

            return ResponseEntity.ok(Map.of("message", "Registration successful"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/register/doctor")
    public ResponseEntity<?> registerDoctor(@RequestBody DoctorRegisterRequest request) {
        System.out.println("AUTH REST: Registering DOCTOR: " + request.getUser().getUsername());
        String passwordMatchError = validatePasswordMatch(request.getUser(), request.getConfirmPassword());
        if (passwordMatchError != null) {
            return ResponseEntity.badRequest().body(Map.of("error", passwordMatchError));
        }
        try {
            authService.registerDoctor(request.getUser(), request.getDoctorProfile());

            // Send Welcome Email
            try {
                String recipientEmail = request.getDoctorProfile().getEmail();
                if (recipientEmail == null || recipientEmail.trim().isEmpty()) {
                    recipientEmail = request.getUser().getUsername();
                }

                Context context = new Context();
                context.setVariable("name", request.getDoctorProfile().getFullName());
                context.setVariable("role", "DOCTOR");
                emailService.sendHtmlEmail(recipientEmail, "Welcome to SmartClinic", "welcome", context);
            } catch (Exception e) {
                System.err.println("AUTH REST: Welcome email failed for doctor (" + request.getUser().getUsername()
                        + "): " + e.getMessage());
                e.printStackTrace();
            }

            return ResponseEntity.ok(Map.of("message", "Registration successful"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/register/staff")
    public ResponseEntity<?> registerStaff(@RequestBody StaffRegisterRequest request) {
        System.out.println("AUTH REST: Registering STAFF: " + request.getUser().getUsername());
        String passwordMatchError = validatePasswordMatch(request.getUser(), request.getConfirmPassword());
        if (passwordMatchError != null) {
            return ResponseEntity.badRequest().body(Map.of("error", passwordMatchError));
        }
        try {
            String roleInput = request.getUser() != null ? request.getUser().getRole() : null;
            if ((roleInput == null || roleInput.isBlank()) && request.getStaffProfile() != null) {
                roleInput = request.getStaffProfile().getJobRole();
            }
            String normalizedRole = normalizeStaffRole(roleInput);
            request.getUser().setRole(normalizedRole);
            if (request.getStaffProfile() != null) {
                request.getStaffProfile().setJobRole("FINANCE_MANAGER".equals(normalizedRole) ? "Finance Manager" : "Nurse");
            }

            authService.registerStaff(request.getUser(), request.getStaffProfile());

            // Send Welcome Email
            try {
                String recipientEmail = request.getStaffProfile().getEmail();
                if (recipientEmail == null || recipientEmail.trim().isEmpty()) {
                    recipientEmail = request.getUser().getUsername();
                }

                Context context = new Context();
                context.setVariable("name", request.getStaffProfile().getFullName());
                context.setVariable("role", normalizedRole);
                emailService.sendHtmlEmail(recipientEmail, "Welcome to SmartClinic", "welcome", context);
            } catch (Exception e) {
                System.err.println("AUTH REST: Welcome email failed for staff (" + request.getUser().getUsername()
                        + "): " + e.getMessage());
                e.printStackTrace();
            }

            return ResponseEntity.ok(Map.of("message", "Registration successful"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private static String normalizeStaffRole(String raw) {
        String r = raw == null ? "" : raw.trim().toUpperCase();
        if (r.startsWith("ROLE_")) r = r.substring(5);
        r = r.replace(' ', '_');

        if ("FINANCE_MANAGER".equals(r) || "FINANCE".equals(r) || "PAYMENT_MANAGER".equals(r)) {
            return "FINANCE_MANAGER";
        }
        if ("NURSE".equals(r) || "STAFF".equals(r)) {
            return "NURSE";
        }

        throw new RuntimeException("Only Nurse and Finance Manager can be registered via staff registration.");
    }

    private static String validatePasswordMatch(User user, String confirmPassword) {
        String password = user == null ? null : user.getPassword();
        if (password == null || password.isBlank()) {
            return "Password is required";
        }
        if (confirmPassword == null || confirmPassword.isBlank()) {
            return "Confirm password is required";
        }
        if (!password.equals(confirmPassword)) {
            return "Passwords do not match";
        }
        return null;
    }
}
