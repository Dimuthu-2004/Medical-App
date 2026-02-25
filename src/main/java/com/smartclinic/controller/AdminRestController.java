package com.smartclinic.controller;

import com.smartclinic.model.User;
import com.smartclinic.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminRestController {

    static {
        System.out.println("DEBUG: AdminRestController initialized");
    }

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final ConsultationNoteRepository consultationNoteRepository;
    private final FeedbackRepository feedbackRepository;

    /** Summary stats for the dashboard cards */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        long totalUsers = userRepository.count();
        long totalPatients = patientRepository.count();
        long totalDoctors = doctorProfileRepository.count();
        long totalStaff = staffProfileRepository.count();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("totalPatients", totalPatients);
        stats.put("totalDoctors", totalDoctors);
        stats.put("totalStaff", totalStaff);
        return ResponseEntity.ok(stats);
    }

    /** User list (with optional search) */
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getUsers(
            @RequestParam(value = "search", required = false) String search) {

        List<User> users = new ArrayList<>();
        if (search != null && !search.isBlank()) {
            users.addAll(userRepository.findByUsernameContainingIgnoreCase(search));
            patientRepository.findByNameContainingIgnoreCase(search).forEach(p -> {
                if (p.getUser() != null && !users.contains(p.getUser()))
                    users.add(p.getUser());
            });
            if (search.matches("\\d+")) {
                userRepository.findById(Long.parseLong(search))
                        .filter(u -> !users.contains(u))
                        .ifPresent(users::add);
            }
        } else {
            users.addAll(userRepository.findAll());
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (User u : users) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", u.getId());
            row.put("username", u.getUsername());
            row.put("role", u.getRole());

            // Attach patient name if exists
            patientRepository.findByUserId(u.getId())
                    .ifPresent(p -> row.put("name", p.getName()));

            // Attach availability for doctors/staff
            String roleUpper = u.getRole().toUpperCase();
            if (roleUpper.contains("DOCTOR")) {
                doctorProfileRepository.findByUserId(u.getId())
                        .ifPresent(d -> row.put("available", d.isAvailable()));
            } else if (roleUpper.contains("RECEPTIONIST") || roleUpper.contains("NURSE")
                    || roleUpper.contains("STAFF") || roleUpper.contains("PAYMENT_MANAGER")
                    || roleUpper.contains("LAB")) {
                staffProfileRepository.findByUserId(u.getId())
                        .ifPresent(s -> row.put("available", s.isAvailable()));
            }

            result.add(row);
        }
        return ResponseEntity.ok(result);
    }

    /** Delete user and all related data */
    @DeleteMapping("/users/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
        System.out.println("DEBUG: deleteUser called for id=" + id);
        try {
            if (!userRepository.existsById(id)) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found: " + id));
            }
            User user = userRepository.findById(id).get();

            // Clean up patient data
            patientRepository.findByUserId(id).ifPresent(patient -> {
                System.out.println("DEBUG: Deleting patient data for " + patient.getName());
                try {
                    consultationNoteRepository.deleteAll(
                            consultationNoteRepository.findByPatientOrderByConsultationDateDesc(patient));
                } catch (Exception e) {
                    System.err.println("WARN: Failed to delete consultation notes: " + e.getMessage());
                }
                try {
                    prescriptionRepository.deleteAll(prescriptionRepository.findByPatientId(patient.getId()));
                } catch (Exception e) {
                    System.err.println("WARN: Failed to delete prescriptions: " + e.getMessage());
                }
                appointmentRepository.findByPatientId(patient.getId()).forEach(appt -> {
                    try {
                        if (appt.getFeedback() != null) {
                            feedbackRepository.deleteById(appt.getFeedback().getId());
                        }
                    } catch (Exception e) {
                        System.err.println(
                                "WARN: Failed to delete feedback for appt " + appt.getId() + ": " + e.getMessage());
                    }
                    appointmentRepository.deleteById(appt.getId());
                });
                patientRepository.delete(patient);
            });

            // Clean up doctor data
            doctorProfileRepository.findByUserId(id).ifPresent(doctor -> {
                System.out.println("DEBUG: Cleaning up doctor data for " + doctor.getFullName());
                appointmentRepository.findByDoctor(doctor).forEach(a -> {
                    try {
                        if (a.getFeedback() != null) {
                            feedbackRepository.deleteById(a.getFeedback().getId());
                        }
                    } catch (Exception e) {
                        System.err.println(
                                "WARN: Failed to delete feedback for appt " + a.getId() + ": " + e.getMessage());
                    }
                    a.setDoctor(null);
                    appointmentRepository.save(a);
                });
                consultationNoteRepository.findByDoctor(user).forEach(n -> {
                    n.setDoctor(null);
                    consultationNoteRepository.save(n);
                });
                try {
                    prescriptionRepository.deleteAll(prescriptionRepository.findByDoctorId(user.getId()));
                } catch (Exception e) {
                    System.err.println("WARN: Failed to delete doctor prescriptions: " + e.getMessage());
                }
                doctorProfileRepository.delete(doctor);
            });

            // Clean up staff profile
            staffProfileRepository.findByUserId(id).ifPresent(sp -> {
                System.out.println("DEBUG: Deleting staff profile for user " + id);
                staffProfileRepository.delete(sp);
            });

            // Finally delete the user
            userRepository.deleteById(id);
            System.out.println("DEBUG: User " + id + " deleted successfully.");
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));

        } catch (Exception e) {
            System.err.println("ERROR: Failed to delete user " + id + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Delete failed: " + e.getMessage()));
        }
    }

    /** Update user role */
    @PatchMapping("/users/{id}/role")
    public ResponseEntity<Void> updateRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        userRepository.findById(id).ifPresent(user -> {
            user.setRole(body.get("role"));
            userRepository.save(user);
        });
        return ResponseEntity.ok().build();
    }

    @GetMapping("/patients/{userId}")
    public ResponseEntity<Map<String, Object>> getPatientDetails(@PathVariable Long userId) {
        System.out.println("DEBUG: getPatientDetails called for userId: " + userId);
        try {
            Optional<com.smartclinic.model.Patient> patientOpt = patientRepository.findByUserId(userId);

            if (patientOpt.isPresent()) {
                com.smartclinic.model.Patient p = patientOpt.get();
                Map<String, Object> details = new HashMap<>();
                details.put("id", p.getId());
                details.put("name", p.getName());
                if (p.getUser() != null) {
                    details.put("username", p.getUser().getUsername());
                }
                details.put("email", p.getEmail());
                details.put("phone", p.getPhone());
                details.put("alternatePhone", p.getAlternatePhone());
                details.put("address", p.getAddress());
                details.put("nic", p.getNic());
                details.put("dob", p.getDob());
                details.put("gender", p.getGender());
                details.put("bloodGroup", p.getBloodGroup());
                details.put("allergies", p.getAllergies());
                details.put("chronicConditions", p.getChronicConditions());
                System.out.println("DEBUG: Patient details found for user " + userId + ": " + p.getName());
                return ResponseEntity.ok(details);
            } else {
                System.out.println("DEBUG: Patient profile missing for user " + userId + ", checking user role...");
                return userRepository.findById(userId)
                        .map(u -> {
                            String role = (u.getRole() != null) ? u.getRole().toUpperCase() : "";
                            System.out.println("DEBUG: User " + userId + " exists with role: " + role
                                    + " but no Patient profile record.");
                            if (role.contains("PATIENT")) {
                                System.out.println("DEBUG: Returning basic user info for ID: " + userId);
                                Map<String, Object> details = new HashMap<>();
                                details.put("id", userId);
                                details.put("name", u.getUsername() + " (Profile Missing)");
                                details.put("username", u.getUsername());
                                details.put("email", "Profile not configured");
                                details.put("role", role);
                                return ResponseEntity.ok(details);
                            }
                            System.out.println("DEBUG: User " + userId + " is not a patient. Returning 404.");
                            return ResponseEntity.notFound().<Map<String, Object>>build();
                        })
                        .orElseGet(() -> {
                            System.err.println("DEBUG: No user found in database for ID: " + userId);
                            return ResponseEntity.status(404).body(null);
                        });
            }
        } catch (Exception e) {
            System.err.println(
                    "ERROR in AdminRestController.getPatientDetails for userId " + userId + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Internal Server Error: " + e.getMessage()));
        }
    }

    /** Toggle doctor availability (Admin only) */
    @PatchMapping("/doctors/{userId}/availability")
    public ResponseEntity<?> toggleDoctorAvailability(
            @PathVariable Long userId,
            @RequestBody Map<String, Boolean> body) {
        boolean available = Boolean.TRUE.equals(body.get("available"));
        System.out.println("DEBUG: toggleDoctorAvailability for userId: " + userId + ", set to: " + available);
        return doctorProfileRepository.findByUserId(userId)
                .map(doctor -> {
                    doctor.setAvailable(available);
                    doctorProfileRepository.save(doctor);
                    System.out.println(
                            "DEBUG: Updated doctor profile " + doctor.getId() + " availability to " + available);
                    return ResponseEntity.ok(Map.of(
                            "message", available ? "Doctor is now available." : "Doctor marked as unavailable.",
                            "available", available));
                })
                .orElseGet(() -> {
                    // Create stub profile if missing
                    return userRepository.findById(userId).map(user -> {
                        com.smartclinic.model.DoctorProfile d = new com.smartclinic.model.DoctorProfile();
                        d.setUser(user);
                        d.setFullName(user.getUsername());
                        d.setSlmcNumber("PENDING");
                        d.setSpecialization("General");
                        d.setAvailable(available);
                        doctorProfileRepository.save(d);
                        return ResponseEntity
                                .ok(Map.of("message", "Profile created and status set", "available", available));
                    }).orElse(ResponseEntity.notFound().build());
                });
    }

    /** Toggle staff availability (Admin only) */
    @PatchMapping("/staff/{userId}/availability")
    public ResponseEntity<?> toggleStaffAvailability(
            @PathVariable Long userId,
            @RequestBody Map<String, Boolean> body) {
        boolean available = Boolean.TRUE.equals(body.get("available"));
        System.out.println("DEBUG: toggleStaffAvailability for userId: " + userId + ", set to: " + available);
        return staffProfileRepository.findByUserId(userId)
                .map(staff -> {
                    staff.setAvailable(available);
                    staffProfileRepository.save(staff);
                    System.out
                            .println("DEBUG: Updated staff profile " + staff.getId() + " availability to " + available);
                    return ResponseEntity.ok(Map.of(
                            "message", available ? "Staff is now available." : "Staff marked as unavailable.",
                            "available", available));
                })
                .orElseGet(() -> {
                    // Create stub profile if missing
                    return userRepository.findById(userId).map(user -> {
                        com.smartclinic.model.StaffProfile s = new com.smartclinic.model.StaffProfile();
                        s.setUser(user);
                        s.setFullName(user.getUsername());
                        s.setNic("PENDING");
                        s.setJobRole("Staff");
                        s.setAvailable(available);
                        staffProfileRepository.save(s);
                        return ResponseEntity
                                .ok(Map.of("message", "Profile created and status set", "available", available));
                    }).orElse(ResponseEntity.notFound().build());
                });
    }
}
