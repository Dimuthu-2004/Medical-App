package com.smartclinic.controller;

import com.smartclinic.model.Announcement;
import com.smartclinic.model.Appointment;
import com.smartclinic.model.PharmacyInventoryItem;
import com.smartclinic.model.Patient;
import com.smartclinic.model.User;
import com.smartclinic.repository.AppointmentRepository;
import com.smartclinic.repository.PatientRepository;
import com.smartclinic.repository.PharmacyInventoryRepository;
import com.smartclinic.repository.UserRepository;
import com.smartclinic.service.AnnouncementService;
import com.smartclinic.service.EmailService;
import com.smartclinic.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientRestController {

        private static final Logger log = LoggerFactory.getLogger(PatientRestController.class);

        private final PatientService patientService;
        private final AppointmentRepository appointmentRepository;
        private final AnnouncementService announcementService;
        private final EmailService emailService;
        private final UserRepository userRepository;
        private final PatientRepository patientRepository;
        private final PharmacyInventoryRepository pharmacyInventoryRepository;

        @GetMapping("/dashboard")
        public ResponseEntity<Map<String, Object>> getDashboardData(Principal principal) {
                if (principal == null) {
                        return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
                }

                String username = principal.getName();
                User user = userRepository.findByUsernameIgnoreCase(username).orElse(null);
                Patient patient = patientService.findByUsername(username).orElse(null);

                // Fallback by user id to avoid username case/canonicalization mismatches.
                if (patient == null && user != null) {
                        patient = patientRepository.findByUserId(user.getId()).orElse(null);
                }

                // Self-heal: older records can have a PATIENT user without a Patient profile.
                if (patient == null) {
                        if (user != null && "PATIENT".equalsIgnoreCase(user.getRole())) {
                                Patient created = new Patient();
                                created.setName(user.getUsername());
                                created.setPhone("0000000000");
                                if (user.getUsername() != null && user.getUsername().contains("@")) {
                                        created.setEmail(user.getUsername());
                                }
                                created.setUser(user);
                                patient = patientService.save(created);
                                log.info("Dashboard self-heal: created patient profile for user {}", username);
                        }
                }

                if (patient != null && user != null) {
                        boolean changed = false;
                        if ((patient.getName() == null || patient.getName().isBlank()) && user.getUsername() != null) {
                                patient.setName(user.getUsername());
                                changed = true;
                        }
                        if ((patient.getEmail() == null || patient.getEmail().isBlank())
                                        && user.getUsername() != null && user.getUsername().contains("@")) {
                                patient.setEmail(user.getUsername());
                                changed = true;
                        }
                        if (patient.getPhone() == null || patient.getPhone().isBlank()) {
                                patient.setPhone("0000000000");
                                changed = true;
                        }
                        if (changed) {
                                patient = patientService.save(patient);
                                log.info("Dashboard self-heal: backfilled patient profile fields for user {}", username);
                        }
                }

                Map<String, Object> response = new HashMap<>();
                response.put("username", username);
                if (patient != null) {
                        // Map.of(...) does not allow null values; some optional fields (like address) can be null.
                        Map<String, Object> patientDto = new HashMap<>();
                        patientDto.put("id", patient.getId());
                        patientDto.put("name", patient.getName());
                        patientDto.put("phone", patient.getPhone());
                        patientDto.put("address", patient.getAddress());
                        response.put("patient", patientDto);

                        List<Appointment> appointments = appointmentRepository.findByPatientId(patient.getId());
                        List<Map<String, Object>> apptData = appointments.stream().map(appt -> {
                                Map<String, Object> map = new HashMap<>();
                                map.put("id", appt.getId());
                                map.put("doctorName",
                                                appt.getDoctor() != null ? "Dr. " + appt.getDoctor().getFullName()
                                                                : "General Consultation");
                                map.put("dateTime",
                                                appt.getDateTime() != null
                                                                ? appt.getDateTime()
                                                                                .format(DateTimeFormatter.ofPattern(
                                                                                                "yyyy-MM-dd HH:mm"))
                                                                : (appt.getAppointmentDate() != null
                                                                                ? appt.getAppointmentDate().toString()
                                                                                : "N/A"));
                                map.put("tokenNumber", appt.getTokenNumber());
                                map.put("notes", appt.getNotes());
                                map.put("paid", appt.getPaid() != null ? appt.getPaid() : false);
                                map.put("status", appt.getStatus() != null ? appt.getStatus().name() : "PENDING");
                                map.put("hasFeedback", appt.getFeedback() != null);
                                map.put("paymentAmount", appt.getPaymentAmount());
                                return map;
                        }).collect(Collectors.toList());
                        response.put("appointments", apptData);

                        List<Announcement> announcements;
                        try {
                                announcements = announcementService.getAnnouncementsForPatient(patient);
                        } catch (Exception ex) {
                                log.warn("Dashboard: failed to load announcements for user {}", username, ex);
                                announcements = Collections.emptyList();
                        }
                        response.put("announcements", announcements);

                        // Stats for cards
                        Map<String, Object> stats = new HashMap<>();
                        stats.put("totalAppointments", appointments.size());
                        stats.put("pendingPayments",
                                        appointments.stream().filter(a -> a.getPaid() == null || !a.getPaid()).count());
                        stats.put("activeAnnouncements", announcements.size());
                        response.put("stats", stats);
                }

                return ResponseEntity.ok(response);
        }

        @GetMapping("/profile")
        public ResponseEntity<Patient> getProfile(Principal principal) {
                Patient patient = resolvePatientFromPrincipal(principal)
                                .orElseThrow(() -> new RuntimeException("Patient profile not found"));
                return ResponseEntity.ok(patient);
        }

        @GetMapping("/drug-inventory")
        public ResponseEntity<List<PharmacyInventoryItem>> getDrugInventory() {
                List<PharmacyInventoryItem> items = pharmacyInventoryRepository.findAll()
                                .stream()
                                .sorted(Comparator.comparing(
                                                item -> item.getName() == null ? "" : item.getName().toLowerCase()))
                                .toList();
                return ResponseEntity.ok(items);
        }

        @PostMapping("/profile/update")
        public ResponseEntity<Map<String, String>> updateProfile(@RequestBody Patient formPatient,
                        Principal principal) {
                String principalName = principal != null ? principal.getName() : null;
                Patient existingPatient = resolvePatientFromPrincipal(principal)
                                .orElseThrow(() -> new RuntimeException("Patient profile not found"));

                if (formPatient == null) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Invalid profile payload."));
                }

                String phone = normalize(formPatient.getPhone());
                if (phone == null || phone.isBlank()) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Primary phone is required."));
                }
                String name = normalize(formPatient.getName());
                if (name == null || name.isBlank()) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Name is required."));
                }

                existingPatient.setName(name);
                existingPatient.setPhone(phone);
                existingPatient.setAlternatePhone(normalize(formPatient.getAlternatePhone()));
                existingPatient.setAddress(normalize(formPatient.getAddress()));
                existingPatient.setAllergies(normalize(formPatient.getAllergies()));
                existingPatient.setChronicConditions(normalize(formPatient.getChronicConditions()));
                existingPatient.setNic(normalize(formPatient.getNic()));
                existingPatient.setBloodGroup(normalize(formPatient.getBloodGroup()));
                existingPatient.setDob(formPatient.getDob());

                patientService.save(existingPatient);

                // Send email notification (Optional/Non-blocking for the user)
                try {
                        org.thymeleaf.context.Context context = new org.thymeleaf.context.Context();
                        context.setVariable("name", existingPatient.getName());
                        context.setVariable("time",
                                        java.time.LocalDateTime.now()
                                                        .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));

                        String targetEmail = existingPatient.getEmail() != null ? existingPatient.getEmail() : principalName;
                        emailService.sendHtmlEmail(targetEmail, "Security Update: Profile Updated", "profile_update",
                                        context);
                        System.out.println("DEBUG: Profile update email sent to " + targetEmail);
                } catch (Exception e) {
                        System.err.println("WARN: Failed to send profile update email: " + e.getMessage());
                }

                return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
        }

        private Optional<Patient> resolvePatientFromPrincipal(Principal principal) {
                if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
                        return Optional.empty();
                }

                String username = principal.getName().trim();

                // Primary path
                Optional<Patient> byUsername = patientService.findByUsername(username);
                if (byUsername.isPresent()) {
                        return byUsername;
                }

                // Fallback for username canonicalization/case mismatches.
                User user = userRepository.findByUsernameIgnoreCase(username).orElse(null);
                if (user == null) {
                        return Optional.empty();
                }

                Optional<Patient> byUserId = patientRepository.findByUserId(user.getId());
                if (byUserId.isPresent()) {
                        return byUserId;
                }

                // Self-heal: create missing profile for PATIENT role users.
                if ("PATIENT".equalsIgnoreCase(user.getRole())) {
                        Patient created = new Patient();
                        created.setName(
                                        user.getUsername() != null && !user.getUsername().isBlank() ? user.getUsername()
                                                        : "Patient");
                        created.setPhone("0000000000");
                        if (user.getUsername() != null && user.getUsername().contains("@")) {
                                created.setEmail(user.getUsername());
                        }
                        created.setUser(user);
                        return Optional.of(patientService.save(created));
                }

                return Optional.empty();
        }

        private String normalize(String value) {
                if (value == null) {
                        return null;
                }
                String trimmed = value.trim();
                return trimmed.isEmpty() ? null : trimmed;
        }
}
