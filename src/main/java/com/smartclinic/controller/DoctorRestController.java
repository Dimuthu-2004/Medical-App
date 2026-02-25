package com.smartclinic.controller;

import com.smartclinic.model.*;
import com.smartclinic.repository.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/doctor")
public class DoctorRestController {

    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final UserRepository userRepository;
    private final com.smartclinic.service.PatientService patientService;

    public DoctorRestController(
            PatientRepository patientRepository,
            AppointmentRepository appointmentRepository,
            PrescriptionRepository prescriptionRepository,
            DoctorProfileRepository doctorProfileRepository,
            UserRepository userRepository,
            com.smartclinic.service.PatientService patientService) {
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.userRepository = userRepository;
        this.patientService = patientService;
    }

    /** Dashboard data: patient list + today's queue summary */
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getDashboard(
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal UserDetails userDetails) {

        String username = userDetails.getUsername();

        User currentUser = userRepository.findByUsername(username).orElseThrow();
        String role = currentUser.getRole().toUpperCase();

        DoctorProfile doctor = null;
        if (!role.contains("ADMIN")) {
            doctor = doctorProfileRepository.findByUserId(currentUser.getId()).orElse(null);
        }

        List<Patient> patients;
        if (search != null && !search.trim().isEmpty()) {
            patients = patientService.searchPatients(search);
        } else {
            patients = patientRepository.findAll();
        }

        List<Map<String, Object>> patientList = patients.stream().map(p -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", p.getId());
            m.put("name", p.getName());
            m.put("dob", p.getDob());
            m.put("allergies", p.getAllergies());
            m.put("chronicConditions", p.getChronicConditions());
            if (p.getDob() != null) {
                int age = java.time.Period.between(p.getDob(), LocalDate.now()).getYears();
                m.put("age", age);
            } else {
                m.put("age", null);
            }
            List<Prescription> prescriptions = prescriptionRepository.findByPatientId(p.getId());
            m.put("prescriptionCount", prescriptions.size());
            return m;
        }).collect(Collectors.toList());

        // Filter appointments: include only doctor-specific appointments
        List<Appointment> allAppointments;
        if (doctor != null) {
            allAppointments = appointmentRepository.findByDoctor(doctor);
        } else {
            allAppointments = appointmentRepository.findAll();
        }

        Map<String, List<Map<String, Object>>> tokensByDate = new LinkedHashMap<>();

        for (Appointment appt : allAppointments) {
            String dateKey = appt.getAppointmentDate() != null
                    ? appt.getAppointmentDate().toString()
                    : (appt.getDateTime() != null ? appt.getDateTime().toLocalDate().toString() : "unknown");

            Map<String, Object> tokenMap = buildTokenMap(appt);
            tokensByDate.computeIfAbsent(dateKey, k -> new ArrayList<>()).add(tokenMap);
        }

        String today = LocalDate.now().toString();
        List<Map<String, Object>> todayTokens = tokensByDate.getOrDefault(today, Collections.emptyList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("patients", patientList);
        result.put("tokensByDate", tokensByDate);
        result.put("todayTokens", todayTokens);
        result.put("doctorProfile", doctor);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/tokens")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getTokensForDate(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal UserDetails userDetails) {

        String username = userDetails.getUsername();
        User currentUser = userRepository.findByUsername(username).orElseThrow();
        String role = currentUser.getRole().toUpperCase();

        DoctorProfile doctor = null;
        if (!role.contains("ADMIN")) {
            doctor = doctorProfileRepository.findByUserId(currentUser.getId()).orElse(null);
        }

        final DoctorProfile finalDoctor = doctor;
        List<Appointment> allAppts = appointmentRepository.findAll();

        List<Appointment> appts = allAppts.stream()
                .filter(a -> {
                    LocalDate aDate = a.getAppointmentDate() != null ? a.getAppointmentDate()
                            : (a.getDateTime() != null ? a.getDateTime().toLocalDate() : null);

                    if (!date.equals(aDate)) {
                        return false;
                    }

                    if (finalDoctor != null) {
                        if (a.getDoctor() == null) {
                            return false; // General appt, not for this specific doctor
                        }
                        if (!a.getDoctor().getId().equals(finalDoctor.getId())) {
                            return false; // Appt for another doctor
                        }
                    }
                    return true;
                })
                .sorted(Comparator.comparing(a -> a.getTokenNumber() != null ? a.getTokenNumber() : Integer.MAX_VALUE))
                .collect(Collectors.toList());

        List<Map<String, Object>> result = appts.stream().map(this::buildTokenMap).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /** Mark appointment as COMPLETED (doctor serves patient) */
    @PostMapping("/complete/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<?> completeAppointment(@PathVariable("id") Long id) {
        return appointmentRepository.findById(id).map(appt -> {
            appt.setStatus(AppointmentStatus.COMPLETED);
            appointmentRepository.save(appt);
            return ResponseEntity.ok(Map.of("message", "Appointment marked as completed"));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Add prescription - same logic as DoctorController.addPrescription */
    @PostMapping("/prescription/add")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<?> addPrescription(
            @RequestParam("patientId") Long patientId,
            @RequestParam("medication") String medication,
            @RequestParam("instructions") String instructions,
            @AuthenticationPrincipal UserDetails userDetails) {
        User doctor = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
        Prescription p = new Prescription();
        p.setPatient(patientRepository.findById(patientId).orElseThrow());
        p.setDoctor(doctor);
        p.setMedication(medication);
        p.setInstructions(instructions);
        p.setDate(LocalDate.now());
        prescriptionRepository.save(p);
        return ResponseEntity.ok(Map.of("message", "Prescription added"));
    }

    /** List all doctors (for appointment booking, includes availability) */
    @GetMapping("/all")
    public ResponseEntity<List<Map<String, Object>>> getAllDoctors() {
        List<Map<String, Object>> result = doctorProfileRepository.findAll().stream().map(d -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", d.getId());
            m.put("fullName", d.getFullName());
            m.put("specialization", d.getSpecialization());
            m.put("clinicName", d.getClinicName());
            m.put("consultationFee", d.getConsultationFee());
            m.put("available", d.isAvailable());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /** Toggle doctor self-availability */
    @PatchMapping("/availability")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<?> updateSelfAvailability(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Boolean> body) {
        String username = userDetails.getUsername();

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).build();
        }

        boolean available = Boolean.TRUE.equals(body.get("available"));

        return doctorProfileRepository.findByUserId(userOpt.get().getId())
                .map(doctor -> {
                    doctor.setAvailable(available);
                    doctorProfileRepository.save(doctor);
                    return ResponseEntity.ok(Map.of(
                            "message", available ? "You are now available." : "You are now marked as unavailable.",
                            "available", available));
                })
                .orElseGet(() -> {
                    User user = userOpt.get();
                    DoctorProfile d = new DoctorProfile();
                    d.setUser(user);
                    d.setFullName(user.getUsername());
                    d.setSlmcNumber("PENDING");
                    d.setSpecialization("General");
                    d.setAvailable(available);
                    doctorProfileRepository.save(d);
                    return ResponseEntity.ok(Map.of(
                            "message", "Profile initialized and status updated.",
                            "available", available));
                });
    }

    private Map<String, Object> buildTokenMap(Appointment appt) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", appt.getId());
        m.put("tokenNumber", appt.getTokenNumber());
        m.put("patientName", appt.getPatient() != null ? appt.getPatient().getName() : "Unknown");
        m.put("patientId", appt.getPatient() != null ? appt.getPatient().getId() : null);
        m.put("status", appt.getStatus() != null ? appt.getStatus().name() : "PENDING");
        m.put("sessionType", appt.getSessionType() != null ? appt.getSessionType().name() : null);
        m.put("appointmentDate", appt.getAppointmentDate() != null ? appt.getAppointmentDate().toString() : null);
        m.put("doctorName", appt.getDoctor() != null ? appt.getDoctor().getFullName() : null);
        return m;
    }
}
