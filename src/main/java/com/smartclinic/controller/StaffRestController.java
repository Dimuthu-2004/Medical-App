package com.smartclinic.controller;

import com.smartclinic.model.User;
import com.smartclinic.repository.StaffProfileRepository;
import com.smartclinic.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffRestController {

    private final StaffProfileRepository staffProfileRepository;
    private final UserRepository userRepository;

    /** Toggle staff self-availability */
    @PatchMapping("/availability")
    @PreAuthorize("hasAnyRole('NURSE', 'STAFF')")
    public ResponseEntity<?> updateSelfAvailability(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Boolean> body) {
        String username = userDetails.getUsername();
        System.out.println("DEBUG: Staff self-availability toggle requested by " + username);

        User user = userRepository.findByUsername(username).orElseThrow();
        boolean available = Boolean.TRUE.equals(body.get("available"));

        return staffProfileRepository.findByUserId(user.getId())
                .map(staff -> {
                    staff.setAvailable(available);
                    staffProfileRepository.save(staff);
                    System.out.println("DEBUG: Staff availability for " + username + " set to " + available);
                    return ResponseEntity.ok(Map.of(
                            "message", available ? "You are now available." : "You are now marked as unavailable.",
                            "available", available));
                })
                .orElseGet(() -> {
                    System.out.println("DEBUG: Auto-creating profile for staff: " + username);
                    com.smartclinic.model.StaffProfile s = new com.smartclinic.model.StaffProfile();
                    s.setUser(user);
                    s.setFullName(user.getUsername());
                    s.setNic("PENDING");
                    s.setJobRole("Staff");
                    s.setAvailable(available);
                    staffProfileRepository.save(s);
                    return ResponseEntity.ok(Map.of(
                            "message", "Profile initialized and status updated.",
                            "available", available));
                });
    }
}
