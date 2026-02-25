package com.smartclinic.controller;

import com.smartclinic.model.Prescription;
import com.smartclinic.model.User;
import com.smartclinic.repository.PatientRepository;
import com.smartclinic.repository.UserRepository;
import com.smartclinic.service.DrugInteractionService;
import com.smartclinic.service.PrescriptionService;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * REST controller for prescription-related operations.
 */
@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionRestController {

    private final DrugInteractionService drugInteractionService;
    private final PrescriptionService prescriptionService;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    // Manual constructor to avoid Lombok @RequiredArgsConstructor issues
    public PrescriptionRestController(
            DrugInteractionService drugInteractionService,
            PrescriptionService prescriptionService,
            PatientRepository patientRepository,
            UserRepository userRepository) {
        this.drugInteractionService = drugInteractionService;
        this.prescriptionService = prescriptionService;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
    }

    /**
     * GET /api/prescriptions/check-interaction?drug1=Aspirin&drug2=Warfarin
     */
    @GetMapping("/check-interaction")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<Map<String, String>> checkInteraction(
            @RequestParam("drug1") String drug1,
            @RequestParam("drug2") String drug2) {

        if (drug1 == null || drug1.isBlank() || drug2 == null || drug2.isBlank()) {
            Map<String, String> err = Map.of(
                    "drug1", drug1 != null ? drug1 : "",
                    "drug2", drug2 != null ? drug2 : "",
                    "severity", "UNKNOWN",
                    "description", "Both drug names are required.",
                    "status", "ERROR");
            return ResponseEntity.badRequest().body(err);
        }

        Map<String, String> result = drugInteractionService.checkInteraction(drug1, drug2);
        return ResponseEntity.ok(result);
    }

    /** List all prescriptions */
    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<List<Prescription>> getAllPrescriptions() {
        return ResponseEntity.ok(prescriptionService.getAll());
    }

    /** List prescriptions for a patient */
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'PATIENT')")
    public ResponseEntity<List<Prescription>> getPatientPrescriptions(@PathVariable Long patientId) {
        return ResponseEntity.ok(prescriptionService.getByPatientId(patientId));
    }

    /** Get single prescription */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'PATIENT')")
    public ResponseEntity<Prescription> getPrescription(@PathVariable Long id) {
        return prescriptionService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Issue a new prescription */
    @PostMapping("/save")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> savePrescription(@RequestBody PrescriptionRequest req,
            @AuthenticationPrincipal UserDetails currentUser) {
        User doctor = userRepository.findByUsername(currentUser.getUsername()).orElseThrow();

        Prescription p = new Prescription();
        p.setPatient(patientRepository.findById(req.getPatientId()).orElseThrow());
        p.setDoctor(doctor);
        p.setMedication(req.getMedication());
        p.setDosage(req.getDosage());
        p.setFrequency(req.getFrequency());
        p.setDuration(req.getDuration());
        p.setInstructions(req.getInstructions());
        p.setNotes(req.getNotes());
        p.setDate(LocalDate.now());

        prescriptionService.save(p);
        return ResponseEntity.ok(Map.of("message", "Prescription saved successfully", "id", p.getId()));
    }

    /** Update prescription */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> updatePrescription(@PathVariable Long id, @RequestBody PrescriptionRequest req) {
        return prescriptionService.getById(id).map(p -> {
            p.setMedication(req.getMedication());
            p.setDosage(req.getDosage());
            p.setFrequency(req.getFrequency());
            p.setDuration(req.getDuration());
            p.setInstructions(req.getInstructions());
            p.setNotes(req.getNotes());
            prescriptionService.save(p);
            return ResponseEntity.ok(Map.of("message", "Prescription updated"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<?> deletePrescription(@PathVariable Long id) {
        prescriptionService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Prescription deleted"));
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'PATIENT')")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        byte[] pdf = prescriptionService.generatePdf(id);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=prescription_" + id + ".pdf")
                .header("Content-Type", "application/pdf")
                .body(pdf);
    }

    @Data
    public static class PrescriptionRequest {
        private Long patientId;
        private String medication;
        private String dosage;
        private String frequency;
        private String duration;
        private String instructions;
        private String notes;
    }
}
