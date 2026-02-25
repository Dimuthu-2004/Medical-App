package com.smartclinic.controller;

import com.smartclinic.model.Announcement;
import com.smartclinic.model.Appointment;
import com.smartclinic.model.Patient;
import com.smartclinic.repository.AppointmentRepository;
import com.smartclinic.service.AnnouncementService;
import com.smartclinic.service.EmailService;
import com.smartclinic.service.PatientService;
import lombok.RequiredArgsConstructor;
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

        private final PatientService patientService;
        private final AppointmentRepository appointmentRepository;
        private final AnnouncementService announcementService;
        private final EmailService emailService;

        @GetMapping("/dashboard")
        public ResponseEntity<Map<String, Object>> getDashboardData(Principal principal) {
                String username = principal.getName();
                Patient patient = patientService.findByUsername(username).orElse(null);

                Map<String, Object> response = new HashMap<>();
                if (patient != null) {
                        response.put("patient", Map.of(
                                        "id", patient.getId(),
                                        "name", patient.getName(),
                                        "phone", patient.getPhone(),
                                        "address", patient.getAddress()));

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
                                map.put("status", appt.getStatus().name());
                                map.put("hasFeedback", appt.getFeedback() != null);
                                map.put("paymentAmount", appt.getPaymentAmount());
                                return map;
                        }).collect(Collectors.toList());
                        response.put("appointments", apptData);

                        List<Announcement> announcements = announcementService.getAnnouncementsForPatient(patient);
                        response.put("announcements", announcements);

                        // Stats for cards
                        response.put("stats", Map.of(
                                        "totalAppointments", appointments.size(),
                                        "pendingPayments",
                                        appointments.stream().filter(a -> a.getPaid() == null || !a.getPaid()).count(),
                                        "activeAnnouncements", announcements.size()));
                }

                return ResponseEntity.ok(response);
        }

        @GetMapping("/profile")
        public ResponseEntity<Patient> getProfile(Principal principal) {
                String username = principal.getName();
                Patient patient = patientService.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException("Patient profile not found"));
                return ResponseEntity.ok(patient);
        }

        @PostMapping("/profile/update")
        public ResponseEntity<Map<String, String>> updateProfile(@RequestBody Patient formPatient,
                        Principal principal) {
                String username = principal.getName();
                Patient existingPatient = patientService.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException("Patient profile not found"));

                existingPatient.setPhone(formPatient.getPhone());
                existingPatient.setAlternatePhone(formPatient.getAlternatePhone());
                existingPatient.setAddress(formPatient.getAddress());
                existingPatient.setAllergies(formPatient.getAllergies());
                existingPatient.setChronicConditions(formPatient.getChronicConditions());

                patientService.save(existingPatient);

                // Send email to correctly registered email address
                org.thymeleaf.context.Context context = new org.thymeleaf.context.Context();
                context.setVariable("name", existingPatient.getName());
                context.setVariable("time",
                                java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));

                String targetEmail = existingPatient.getEmail() != null ? existingPatient.getEmail() : username;
                emailService.sendHtmlEmail(targetEmail, "Security Update: Profile Updated", "profile_update", context);

                return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
        }
}
