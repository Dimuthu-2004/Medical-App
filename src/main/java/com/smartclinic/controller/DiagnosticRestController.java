package com.smartclinic.controller;

import com.smartclinic.model.Appointment;
import com.smartclinic.model.DoctorProfile;
import com.smartclinic.model.Patient;
import com.smartclinic.model.User;
import com.smartclinic.repository.AppointmentRepository;
import com.smartclinic.repository.DoctorProfileRepository;
import com.smartclinic.repository.PatientRepository;
import com.smartclinic.repository.UserRepository;
import com.smartclinic.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thymeleaf.context.Context;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class DiagnosticRestController {

    private final EmailService emailService;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final com.smartclinic.service.DrugInteractionService drugInteractionService;

    // ─── Drug Interaction Tests ──────────────────────────────────────────────────

    @GetMapping("/drug-interaction")
    public ResponseEntity<?> testDrugInteraction(@RequestParam("d1") String d1, @RequestParam("d2") String d2) {
        try {
            return ResponseEntity.ok(drugInteractionService.checkInteraction(d1, d2));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ─── Email Tests ─────────────────────────────────────────────────────────────

    @GetMapping("/email/test")
    public ResponseEntity<?> testEmail(@RequestParam("to") String to) {
        try {
            Context context = new Context();
            context.setVariable("name", "Test User");
            context.setVariable("role", "TEST");
            emailService.sendHtmlEmail(to, "SmartClinic Diagnostic Test", "welcome", context);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Welcome email sent to " + to));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("status", "error", "error", e.getMessage(), "type", e.getClass().getName()));
        }
    }

    @GetMapping("/email/test-announcement")
    public ResponseEntity<?> testAnnouncementEmail(@RequestParam("to") String to) {
        try {
            String title = "Diagnostic Awareness Alert";
            String content = "This is a test announcement to verify the awareness alert system.";
            emailService.sendSimpleEmail(to, "SmartClinic Alert: " + title,
                    content + "\n\nTo view more details, login to your dashboard.");
            return ResponseEntity.ok(Map.of("status", "success", "message", "Announcement email sent to " + to));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("status", "error", "error", e.getMessage()));
        }
    }

    // ─── DB State Diagnostics
    // ─────────────────────────────────────────────────────

    @GetMapping("/db")
    public ResponseEntity<?> dbState() {
        Map<String, Object> report = new LinkedHashMap<>();

        // Users
        List<User> users = userRepository.findAll();
        report.put("totalUsers", users.size());
        report.put("users", users.stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("username", u.getUsername());
            m.put("role", u.getRole());
            return m;
        }).collect(Collectors.toList()));

        // Patients
        List<Patient> patients = patientRepository.findAll();
        report.put("totalPatients", patients.size());
        report.put("patients", patients.stream().map(p -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", p.getId());
            m.put("name", p.getName());
            m.put("email", p.getEmail());
            m.put("userId", p.getUser() != null ? p.getUser().getId() : null);
            return m;
        }).collect(Collectors.toList()));

        // Doctor Profiles
        List<DoctorProfile> doctors = doctorProfileRepository.findAll();
        report.put("totalDoctorProfiles", doctors.size());
        report.put("doctorProfiles", doctors.stream().map(d -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", d.getId());
            m.put("fullName", d.getFullName());
            m.put("userId", d.getUser() != null ? d.getUser().getId() : null);
            m.put("username", d.getUser() != null ? d.getUser().getUsername() : null);
            m.put("available", d.isAvailable());
            return m;
        }).collect(Collectors.toList()));

        // Appointments
        List<Appointment> appointments = appointmentRepository.findAll();
        report.put("totalAppointments", appointments.size());
        report.put("appointments", appointments.stream().map(a -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", a.getId());
            m.put("patient", a.getPatient() != null ? a.getPatient().getName() : "null");
            m.put("doctorProfileId", a.getDoctor() != null ? a.getDoctor().getId() : "null (unassigned)");
            m.put("doctorName", a.getDoctor() != null ? a.getDoctor().getFullName() : "null");
            m.put("date", a.getAppointmentDate() != null ? a.getAppointmentDate().toString()
                    : (a.getDateTime() != null ? a.getDateTime().toLocalDate().toString() : "null"));
            m.put("status", a.getStatus());
            m.put("tokenNumber", a.getTokenNumber());
            return m;
        }).collect(Collectors.toList()));

        System.out.println("===== DIAGNOSTIC DB REPORT =====");
        System.out.println("Users: " + users.size());
        System.out.println("Patients: " + patients.size());
        System.out.println("Doctor Profiles: " + doctors.size());
        System.out.println("Appointments: " + appointments.size());
        System.out.println("================================");

        return ResponseEntity.ok(report);
    }
}
