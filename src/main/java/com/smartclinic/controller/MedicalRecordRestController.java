package com.smartclinic.controller;

import com.smartclinic.model.*;
import com.smartclinic.repository.*;
import com.smartclinic.service.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/medical-records")
@RequiredArgsConstructor
public class MedicalRecordRestController {

    private final MedicalRecordService medicalRecordService;
    private final ClinicalVitalsService clinicalVitalsService;
    private final PatientService patientService;
    private final UserRepository userRepository;
    private final ConsultationNoteService consultationNoteService;
    private final AppointmentRepository appointmentRepository;

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("MedicalRecordRestController is alive");
    }

    /** Get all medical records + vitals for a patient */
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'PATIENT')")
    public ResponseEntity<Map<String, Object>> getPatientRecords(
            @PathVariable Long patientId,
            @AuthenticationPrincipal UserDetails userDetails) {

        System.out.println(
                "DEBUG: getPatientRecords requested for patientId: " + patientId + " by " + userDetails.getUsername());

        try {
            Patient patient = patientService.findById(patientId).orElse(null);
            if (patient == null) {
                System.out.println("DEBUG: Patient not found for ID: " + patientId);
                return ResponseEntity.notFound().build();
            }

            System.out.println("DEBUG: Patient found: " + patient.getName() + " (ID: " + patient.getId() + ")");

            // Security: patients can only see their own records
            User currentUser = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
            if ("PATIENT".equals(currentUser.getRole())
                    && (patient.getUser() == null
                            || !patient.getUser().getUsername().equals(userDetails.getUsername()))) {
                return ResponseEntity.status(403).build();
            }

            List<MedicalRecord> records = medicalRecordService.findByPatient(patient);
            List<Map<String, Object>> recordList = records.stream().map(r -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", r.getId());
                m.put("recordDate", r.getRecordDate() != null ? r.getRecordDate().toString() : null);
                m.put("diagnosis", r.getDiagnosis());
                m.put("medications", r.getMedications());
                m.put("medicalHistory", r.getMedicalHistory());
                m.put("allergies", r.getAllergies());
                m.put("notes", r.getNotes());
                m.put("createdBy", r.getCreatedBy() != null ? r.getCreatedBy().getUsername() : null);
                return m;
            }).collect(Collectors.toList());

            List<ClinicalVitals> vitals = clinicalVitalsService.findByPatient(patient);
            List<Map<String, Object>> vitalsList = vitals.stream().map(v -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", v.getId());
                m.put("recordedAt", v.getRecordedAt() != null ? v.getRecordedAt().toString() : null);
                m.put("weight", v.getWeight());
                m.put("systolicBP", v.getSystolicBP());
                m.put("diastolicBP", v.getDiastolicBP());
                m.put("temperature", v.getTemperature());
                m.put("heartRate", v.getHeartRate());
                return m;
            }).collect(Collectors.toList());

            // Consultation notes for all appointments
            List<Map<String, Object>> consultations = new ArrayList<>();
            for (var appt : appointmentRepository.findByPatientId(patientId)) {
                consultationNoteService.findByAppointment(appt).ifPresent(note -> {
                    Map<String, Object> c = new LinkedHashMap<>();
                    c.put("id", note.getId());
                    c.put("appointmentId", appt.getId());
                    c.put("date", note.getConsultationDate() != null ? note.getConsultationDate().toString() : null);
                    c.put("chiefComplaint", note.getChiefComplaint());
                    c.put("symptoms", note.getSymptoms());
                    c.put("examination", note.getExamination());
                    c.put("diagnosis", note.getDiagnosis());
                    c.put("treatment", note.getTreatment());
                    c.put("followUp", note.getFollowUp());
                    c.put("doctorName", note.getDoctor() != null ? note.getDoctor().getUsername() : null);
                    consultations.add(c);
                });
            }

            Map<String, Object> patientInfo = new LinkedHashMap<>();
            patientInfo.put("id", patient.getId());
            patientInfo.put("name", patient.getName());
            patientInfo.put("dob", patient.getDob() != null ? patient.getDob().toString() : null);
            patientInfo.put("gender", patient.getGender());
            patientInfo.put("bloodGroup", patient.getBloodGroup());
            patientInfo.put("allergies", patient.getAllergies());
            patientInfo.put("chronicConditions", patient.getChronicConditions());

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("patient", patientInfo);
            result.put("records", recordList);
            result.put("vitals", vitalsList);
            result.put("consultations", consultations);
            result.put("currentUserRole", currentUser.getRole());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("ERROR in getPatientRecords: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Internal Error"));
        }
    }

    /** Save/Update a medical record */
    @PostMapping("/save")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<?> saveRecord(@RequestBody RecordRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        System.out.println("DEBUG: saveRecord requested for patientId: " + req.getPatientId());
        try {
            User doctor = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
            Patient patient = patientService.findById(req.getPatientId()).orElseThrow();

            MedicalRecord record;
            if (req.getId() != null) {
                record = medicalRecordService.findById(req.getId()).orElse(new MedicalRecord());
                System.out.println("DEBUG: Updating existing record ID: " + req.getId());
            } else {
                record = new MedicalRecord();
                System.out.println("DEBUG: Creating new medical record");
            }

            record.setPatient(patient);
            record.setDiagnosis(req.getDiagnosis());
            record.setMedications(req.getMedications());
            record.setMedicalHistory(req.getMedicalHistory());
            record.setAllergies(req.getAllergies());
            record.setNotes(req.getNotes());
            record.setCreatedBy(doctor);
            if (record.getRecordDate() == null) {
                record.setRecordDate(LocalDate.now());
            }

            medicalRecordService.save(record);
            System.out.println("DEBUG: Medical record saved successfully. ID: " + record.getId());
            return ResponseEntity.ok(Map.of("message", "Record saved", "id", record.getId()));
        } catch (Exception e) {
            System.err.println("ERROR in saveRecord: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /** Delete a medical record */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<?> deleteRecord(@PathVariable Long id) {
        medicalRecordService.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Record deleted"));
    }

    /** Save a consultation note */
    @PostMapping("/consultation/save")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<?> saveConsultation(@RequestBody ConsultationRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User doctor = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
        var appointment = appointmentRepository.findById(req.getAppointmentId()).orElseThrow();

        ConsultationNote note = consultationNoteService.findByAppointment(appointment)
                .orElse(new ConsultationNote());
        note.setAppointment(appointment);
        note.setPatient(appointment.getPatient());
        note.setDoctor(doctor);
        note.setChiefComplaint(req.getChiefComplaint());
        note.setSymptoms(req.getSymptoms());
        note.setExamination(req.getExamination());
        note.setDiagnosis(req.getDiagnosis());
        note.setTreatment(req.getTreatment());
        note.setFollowUp(req.getFollowUp());
        if (note.getConsultationDate() == null) {
            note.setConsultationDate(java.time.LocalDateTime.now());
        }

        consultationNoteService.save(note);
        return ResponseEntity.ok(Map.of("message", "Consultation note saved"));
    }

    @Data
    public static class RecordRequest {
        private Long id;
        private Long patientId;
        private String diagnosis;
        private String medications;
        private String medicalHistory;
        private String allergies;
        private String notes;
    }

    @Data
    public static class ConsultationRequest {
        private Long appointmentId;
        private String chiefComplaint;
        private String symptoms;
        private String examination;
        private String diagnosis;
        private String treatment;
        private String followUp;
    }
}
