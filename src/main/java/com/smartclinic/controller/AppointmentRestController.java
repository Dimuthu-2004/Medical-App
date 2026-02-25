package com.smartclinic.controller;

import com.smartclinic.model.*;
import com.smartclinic.repository.*;
import com.smartclinic.service.*;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentRestController {

    private final AppointmentService appointmentService;
    private final PatientService patientService;
    private final DoctorProfileRepository doctorRepository;
    private final UserRepository userRepository;
    private final ClinicHoursService clinicHoursService;
    private final EmailService emailService;
    private final AppointmentRepository appointmentRepository;

    public AppointmentRestController(
            AppointmentService appointmentService,
            PatientService patientService,
            DoctorProfileRepository doctorRepository,
            UserRepository userRepository,
            ClinicHoursService clinicHoursService,
            EmailService emailService,
            AppointmentRepository appointmentRepository) {
        this.appointmentService = appointmentService;
        this.patientService = patientService;
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
        this.clinicHoursService = clinicHoursService;
        this.emailService = emailService;
        this.appointmentRepository = appointmentRepository;
    }

    /** Get available sessions for a given date */
    @GetMapping("/sessions")
    public List<ClinicHoursService.ClinicSession> getSessions(
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate date) {
        return clinicHoursService.getBookingSessions(date);
    }

    /** List all doctors with availability */
    @GetMapping("/doctors")
    public ResponseEntity<List<Map<String, Object>>> getDoctors() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (DoctorProfile d : doctorRepository.findAll()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", d.getId());
            m.put("fullName", d.getFullName());
            m.put("specialization", d.getSpecialization());
            m.put("consultationFee", d.getConsultationFee());
            m.put("available", d.isAvailable());
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    /** Get single appointment for viewing/editing */
    @GetMapping("/{id}")
    public ResponseEntity<?> getAppointment(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails.getUsername();
        User user = userRepository.findByUsername(username).orElseThrow();
        Appointment appt = appointmentRepository.findById(id).orElse(null);
        if (appt == null)
            return ResponseEntity.notFound().build();

        // Security check: only own appointment or admin/staff
        if ("PATIENT".equals(user.getRole())) {
            Patient patient = patientService.findByUsername(username).orElse(null);
            if (patient == null || !patient.getId().equals(appt.getPatient().getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Unauthorized access."));
            }
        }

        Map<String, Object> m = new HashMap<>();
        m.put("id", appt.getId());
        m.put("doctorId", appt.getDoctor() != null ? appt.getDoctor().getId() : null);
        m.put("appointmentDate", appt.getAppointmentDate());
        m.put("sessionType", appt.getSessionType());
        m.put("notes", appt.getNotes());
        m.put("status", appt.getStatus());

        return ResponseEntity.ok(m);
    }

    /** Book appointment (same logic as AppointmentController.addAppointment) */
    @PostMapping("/book")
    public ResponseEntity<?> bookAppointment(
            @RequestBody BookRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {

        String username = userDetails.getUsername();
        User user = userRepository.findByUsername(username).orElseThrow();
        String role = user.getRole();

        Appointment appointment;
        if (req.getId() != null) {
            appointment = appointmentRepository.findById(req.getId()).orElse(new Appointment());
            // If updating, we don't change the patient
        } else {
            appointment = new Appointment();
            // Set patient
            if ("PATIENT".equals(role)) {
                Patient patient = patientService.findByUsername(username).orElse(null);
                appointment.setPatient(patient);
                appointment.setStatus(AppointmentStatus.PENDING);
            } else {
                // Admin/staff can specify patient
                if (req.getPatientId() != null) {
                    Patient patient = patientService.findById(req.getPatientId()).orElseThrow();
                    appointment.setPatient(patient);
                }
                appointment.setStatus(AppointmentStatus.PENDING);
            }
        }

        // Validate date
        if (req.getAppointmentDate() == null || req.getAppointmentDate().isBefore(LocalDate.now())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Appointment date must be today or in the future."));
        }

        // Validate doctor availability
        if (req.getDoctorId() != null) {
            DoctorProfile doctor = doctorRepository.findById(req.getDoctorId()).orElse(null);
            if (doctor == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Selected doctor not found."));
            }
            if (!doctor.isAvailable()) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "The selected doctor is currently unavailable. Please choose another doctor."));
            }
            appointment.setDoctor(doctor);
        }

        appointment.setAppointmentDate(req.getAppointmentDate());

        // Set session type
        if (req.getSessionType() != null) {
            try {
                appointment.setSessionType(SessionType.valueOf(req.getSessionType()));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid session type."));
            }
        }

        appointment.setNotes(req.getNotes());

        try {
            appointmentService.save(appointment);

            // Patient confirmation email
            if (appointment.getPatient() != null && appointment.getPatient().getEmail() != null) {
                try {
                    org.thymeleaf.context.Context pCtx = new org.thymeleaf.context.Context();
                    pCtx.setVariable("name", appointment.getPatient().getName());
                    pCtx.setVariable("token", appointment.getTokenNumber());
                    pCtx.setVariable("doctor",
                            appointment.getDoctor() != null ? appointment.getDoctor().getFullName() : "N/A");
                    pCtx.setVariable("date", appointment.getAppointmentDate());
                    pCtx.setVariable("session", appointment.getSessionType());
                    emailService.sendHtmlEmail(appointment.getPatient().getEmail(),
                            "Appointment Confirmed: SmartClinic", "appointment_conf", pCtx);
                } catch (Exception e) {
                    System.err.println("APPOINTMENT REST: Failed to send patient confirmation email to "
                            + appointment.getPatient().getEmail());
                    e.printStackTrace();
                }
            }

            // Admin alert email
            try {
                org.thymeleaf.context.Context aCtx = new org.thymeleaf.context.Context();
                aCtx.setVariable("appointmentId", appointment.getId());
                aCtx.setVariable("patientName",
                        appointment.getPatient() != null ? appointment.getPatient().getName() : "Unknown");
                aCtx.setVariable("doctorName",
                        appointment.getDoctor() != null ? appointment.getDoctor().getFullName() : "N/A");
                aCtx.setVariable("date", appointment.getAppointmentDate());
                aCtx.setVariable("session", appointment.getSessionType());
                aCtx.setVariable("amount", appointment.getPaymentAmount() != null ? appointment.getPaymentAmount() : 0);
                emailService.sendHtmlEmail("drdilinifonseka@gmail.com",
                        "NEW APPOINTMENT ALERT: #" + appointment.getId(), "admin_alert", aCtx);
            } catch (Exception e) {
                System.err.println("APPOINTMENT REST: Failed to send admin alert email");
                e.printStackTrace();
            }

            return ResponseEntity.ok(Map.of("message", "Appointment booked successfully", "tokenNumber",
                    appointment.getTokenNumber(), "appointmentId", appointment.getId()));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Cancel appointment */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelAppointment(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
        String role = user.getRole();

        Appointment appt = appointmentRepository.findById(id).orElse(null);
        if (appt == null)
            return ResponseEntity.notFound().build();

        if ("PATIENT".equals(role)) {
            if (Boolean.TRUE.equals(appt.getPaid())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Cannot cancel paid appointments."));
            }

            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            if (appt.getDateTime() != null) {
                if (java.time.Duration.between(now, appt.getDateTime()).toHours() < 24) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Cannot cancel appointments less than 24 hours in advance."));
                }
            } else if (appt.getAppointmentDate() != null) {
                // Fallback for old data without time
                if (appt.getAppointmentDate().isBefore(LocalDate.now().plusDays(1))) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Cannot cancel appointments less than 24 hours in advance."));
                }
            }
        }

        appointmentService.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Appointment cancelled successfully"));
    }

    /** Check-in appointment */
    @PatchMapping("/{id}/check-in")
    @PreAuthorize("hasAnyRole('STAFF', 'RECEPTIONIST', 'NURSE', 'ADMIN')")
    public ResponseEntity<?> checkIn(@PathVariable Long id) {
        return appointmentRepository.findById(id).map(appt -> {
            appt.setStatus(AppointmentStatus.CONFIRMED);
            appointmentRepository.save(appt);
            return ResponseEntity.ok(Map.of("message", "Patient checked in successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Issue Walk-in appointment */
    @PostMapping("/walk-in")
    @PreAuthorize("hasAnyRole('STAFF', 'RECEPTIONIST', 'NURSE', 'ADMIN')")
    public ResponseEntity<?> issueWalkIn(@RequestBody Map<String, Long> req) {
        Long patientId = req.get("patientId");
        Patient patient = patientService.findById(patientId).orElseThrow();
        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setAppointmentDate(LocalDate.now());
        appointment.setStatus(AppointmentStatus.CONFIRMED); // Walk-ins are checked in immediately
        appointmentRepository.save(appointment);
        return ResponseEntity.ok(Map.of(
                "message", "Walk-in appointment issued",
                "tokenNumber", appointment.getTokenNumber(),
                "id", appointment.getId()));
    }

    @Data
    public static class BookRequest {
        private Long id; // For updates
        private Long patientId;
        private Long doctorId;
        private LocalDate appointmentDate;
        private String sessionType;
        private String notes;
    }
}
