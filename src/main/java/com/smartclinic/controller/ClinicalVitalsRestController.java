package com.smartclinic.controller;

import com.smartclinic.model.ClinicalVitals;
import com.smartclinic.model.Patient;
import com.smartclinic.model.User;
import com.smartclinic.repository.UserRepository;
import com.smartclinic.service.ClinicalVitalsService;
import com.smartclinic.service.PatientService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/vitals")
@RequiredArgsConstructor
public class ClinicalVitalsRestController {

    private final ClinicalVitalsService clinicalVitalsService;
    private final PatientService patientService;
    private final UserRepository userRepository;

    @PostMapping("/save")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<?> saveVitals(@RequestBody VitalsRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User doctor = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
        Patient patient = patientService.findById(req.getPatientId()).orElseThrow();

        ClinicalVitals vitals;
        if (req.getId() != null) {
            vitals = clinicalVitalsService.findById(req.getId()).orElse(new ClinicalVitals());
            System.out.println("DEBUG: Updating existing vitals ID: " + req.getId());
        } else {
            vitals = new ClinicalVitals();
            System.out.println("DEBUG: Creating new vitals record");
        }

        vitals.setPatient(patient);
        vitals.setRecordedBy(doctor);
        vitals.setWeight(req.getWeight());
        vitals.setSystolicBP(req.getSystolicBP());
        vitals.setDiastolicBP(req.getDiastolicBP());
        vitals.setTemperature(req.getTemperature());
        vitals.setHeartRate(req.getHeartRate());

        if (vitals.getRecordedAt() == null) {
            vitals.setRecordedAt(LocalDateTime.now());
        }

        clinicalVitalsService.save(vitals);
        return ResponseEntity.ok(Map.of("message", "Vitals saved", "id", vitals.getId()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<?> deleteVitals(@PathVariable Long id) {
        clinicalVitalsService.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Vitals deleted"));
    }

    @Data
    public static class VitalsRequest {
        private Long id;
        private Long patientId;
        private Double weight;
        private Integer systolicBP;
        private Integer diastolicBP;
        private Double temperature;
        private Integer heartRate;
    }
}
