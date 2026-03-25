package com.smartclinic.controller;

import com.smartclinic.model.Prescription;
import com.smartclinic.model.PrescriptionItem;
import com.smartclinic.model.PharmacyInventoryItem;
import com.smartclinic.model.User;
import com.smartclinic.repository.PatientRepository;
import com.smartclinic.repository.PharmacyInventoryRepository;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
    private final PharmacyInventoryRepository inventoryRepository;

    // Manual constructor to avoid Lombok @RequiredArgsConstructor issues
    public PrescriptionRestController(
            DrugInteractionService drugInteractionService,
            PrescriptionService prescriptionService,
            PatientRepository patientRepository,
            UserRepository userRepository,
            PharmacyInventoryRepository inventoryRepository) {
        this.drugInteractionService = drugInteractionService;
        this.prescriptionService = prescriptionService;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.inventoryRepository = inventoryRepository;
    }

    /**
     * GET /api/prescriptions/check-interaction?drug1=Aspirin&drug2=Warfarin
     */
    @GetMapping("/check-interaction")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'PHARMACIST')")
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
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'PHARMACIST')")
    public ResponseEntity<List<Prescription>> getAllPrescriptions() {
        return ResponseEntity.ok(prescriptionService.getAll());
    }

    /** List prescriptions for a patient */
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'PHARMACIST')")
    public ResponseEntity<List<Prescription>> getPatientPrescriptions(@PathVariable Long patientId) {
        return ResponseEntity.ok(prescriptionService.getByPatientId(patientId));
    }

    /** List prescriptions for currently logged-in patient with inventory availability details */
    @GetMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getMyPrescriptions(@AuthenticationPrincipal UserDetails currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(currentUser.getUsername());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        Optional<com.smartclinic.model.Patient> patientOpt = patientRepository.findByUserId(userOpt.get().getId());
        if (patientOpt.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<Prescription> prescriptions = prescriptionService.getVisibleForPatient(patientOpt.get().getId());

        List<PatientPrescriptionResponse> response = prescriptions.stream()
                .sorted(Comparator.comparing(Prescription::getDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(PrescriptionRestController::toPatientPrescriptionResponse)
                .toList();

        return ResponseEntity.ok(response);
    }

    /** Get single prescription */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'PHARMACIST')")
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
        applyItems(p, req);
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
            applyItems(p, req);
            p.setNotes(req.getNotes());
            prescriptionService.save(p);
            return ResponseEntity.ok(Map.of("message", "Prescription updated"));
        }).orElse(ResponseEntity.notFound().build());
    }

    private static void applyItems(Prescription p, PrescriptionRequest req) {
        // Clear + rebuild items on every save/update so the DB matches the UI's list.
        p.getItems().clear();

        if (req.getItems() != null && !req.getItems().isEmpty()) {
            for (var it : req.getItems()) {
                if (it == null || it.getDrugName() == null || it.getDrugName().isBlank()) continue;
                PrescriptionItem item = new PrescriptionItem();
                item.setPrescription(p);
                item.setDrugName(it.getDrugName().trim());
                item.setDosage(it.getDosage());
                item.setFrequency(it.getFrequency());
                item.setDuration(it.getDuration());
                item.setInstructions(it.getInstructions());
                p.getItems().add(item);
            }

            // Backward-compatible summary fields (used by older UI + simple list views)
            if (!p.getItems().isEmpty()) {
                PrescriptionItem first = p.getItems().get(0);
                p.setMedication(first.getDrugName());
                p.setDosage(first.getDosage());
                p.setFrequency(first.getFrequency());
                p.setDuration(first.getDuration());
                p.setInstructions(first.getInstructions());
            } else {
                p.setMedication("Prescription");
                p.setDosage(null);
                p.setFrequency(null);
                p.setDuration(null);
                p.setInstructions(null);
            }
            return;
        }

        // Legacy single-drug payload support
        String medication = req.getMedication() != null ? req.getMedication().trim() : "";
        if (medication.isEmpty()) {
            medication = "Prescription";
        }
        p.setMedication(medication);
        p.setDosage(req.getDosage());
        p.setFrequency(req.getFrequency());
        p.setDuration(req.getDuration());
        p.setInstructions(req.getInstructions());

        PrescriptionItem item = new PrescriptionItem();
        item.setPrescription(p);
        item.setDrugName(medication);
        item.setDosage(req.getDosage());
        item.setFrequency(req.getFrequency());
        item.setDuration(req.getDuration());
        item.setInstructions(req.getInstructions());
        p.getItems().add(item);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<?> deletePrescription(@PathVariable Long id) {
        prescriptionService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Prescription deleted"));
    }

    @DeleteMapping("/me/{id}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> hideMyPrescription(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        boolean hidden = prescriptionService.hideForPatient(id, currentUser.getUsername());
        if (!hidden) {
            return ResponseEntity.status(404).body(Map.of("error", "Prescription not found"));
        }
        return ResponseEntity.ok(Map.of("message", "Prescription removed from your list"));
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'PHARMACIST')")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        byte[] pdf = prescriptionService.generatePdf(id);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=prescription_" + id + ".pdf")
                .header("Content-Type", "application/pdf")
                .body(pdf);
    }

    @GetMapping("/me/{id}/pdf")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> downloadMyPdf(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        Optional<Prescription> prescription = prescriptionService.getVisibleByIdForPatient(id, currentUser.getUsername());
        if (prescription.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Prescription not found"));
        }
        byte[] pdf = prescriptionService.generatePdf(id);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=prescription_" + id + ".pdf")
                .header("Content-Type", "application/pdf")
                .body(pdf);
    }

    @GetMapping("/me/{id}/availability")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getMyPrescriptionAvailability(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        Optional<Prescription> prescriptionOpt = prescriptionService.getVisibleByIdForPatient(id, currentUser.getUsername());
        if (prescriptionOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Prescription not found"));
        }

        Prescription prescription = prescriptionOpt.get();
        List<PharmacyInventoryItem> inventoryItems = inventoryRepository.findAll();
        Map<String, PharmacyInventoryItem> inventoryByExactName = buildInventoryLookupCaseSensitive(inventoryItems);
        AvailabilityCheckResponse response = toAvailabilityResponse(prescription, inventoryByExactName, inventoryItems);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/dispense")
    @PreAuthorize("hasRole('PHARMACIST')")
    public ResponseEntity<?> markDispensed(@PathVariable Long id) {
        return prescriptionService.getById(id).map(p -> {
            p.setDispensed(true);
            p.setDispensedAt(java.time.LocalDateTime.now());
            prescriptionService.save(p);
            return ResponseEntity.ok(Map.of("message", "Prescription marked as dispensed"));
        }).orElse(ResponseEntity.notFound().build());
    }

    private static Map<String, PharmacyInventoryItem> buildInventoryLookupCaseSensitive(List<PharmacyInventoryItem> items) {
        Map<String, PharmacyInventoryItem> map = new HashMap<>();
        for (PharmacyInventoryItem item : items) {
            String key = normalizeExactName(item.getName());
            if (!key.isBlank() && !map.containsKey(key)) {
                map.put(key, item);
            }
        }
        return map;
    }

    private static PatientPrescriptionResponse toPatientPrescriptionResponse(Prescription prescription) {
        PatientPrescriptionResponse out = new PatientPrescriptionResponse();
        out.setId(prescription.getId());
        out.setDate(prescription.getDate());
        out.setNotes(prescription.getNotes());
        out.setDispensed(Boolean.TRUE.equals(prescription.getDispensed()));
        out.setDispensedAt(prescription.getDispensedAt());

        String doctorName = "Doctor";
        if (prescription.getDoctor() != null && prescription.getDoctor().getUsername() != null) {
            doctorName = prescription.getDoctor().getUsername();
        }
        out.setDoctorName(doctorName);

        List<PrescriptionItem> sourceItems = prescription.getItems();
        if (sourceItems == null || sourceItems.isEmpty()) {
            PrescriptionItem legacy = new PrescriptionItem();
            legacy.setDrugName(prescription.getMedication());
            legacy.setDosage(prescription.getDosage());
            legacy.setFrequency(prescription.getFrequency());
            legacy.setDuration(prescription.getDuration());
            legacy.setInstructions(prescription.getInstructions());
            sourceItems = List.of(legacy);
        }

        List<PatientPrescriptionItemResponse> itemResponses = new ArrayList<>();
        for (PrescriptionItem item : sourceItems) {
            PatientPrescriptionItemResponse row = new PatientPrescriptionItemResponse();
            row.setDrugName(item.getDrugName());
            row.setDosage(item.getDosage());
            row.setFrequency(item.getFrequency());
            row.setDuration(item.getDuration());
            row.setInstructions(item.getInstructions());
            itemResponses.add(row);
        }

        out.setItems(itemResponses);
        return out;
    }

    private static AvailabilityCheckResponse toAvailabilityResponse(
            Prescription prescription,
            Map<String, PharmacyInventoryItem> inventoryByExactName,
            List<PharmacyInventoryItem> inventoryItems) {
        AvailabilityCheckResponse response = new AvailabilityCheckResponse();
        response.setPrescriptionId(prescription.getId());
        response.setDate(prescription.getDate());

        List<PrescriptionItem> sourceItems = prescription.getItems();
        if (sourceItems == null || sourceItems.isEmpty()) {
            PrescriptionItem legacy = new PrescriptionItem();
            legacy.setDrugName(prescription.getMedication());
            legacy.setDosage(prescription.getDosage());
            legacy.setFrequency(prescription.getFrequency());
            legacy.setDuration(prescription.getDuration());
            legacy.setInstructions(prescription.getInstructions());
            sourceItems = List.of(legacy);
        }

        List<AvailabilityItemResponse> availableItems = new ArrayList<>();
        List<AvailabilityItemResponse> unavailableItems = new ArrayList<>();

        for (PrescriptionItem item : sourceItems) {
            AvailabilityItemResponse row = new AvailabilityItemResponse();
            row.setDrugName(item.getDrugName());
            row.setDosage(item.getDosage());
            row.setFrequency(item.getFrequency());
            row.setDuration(item.getDuration());
            row.setInstructions(item.getInstructions());

            String key = normalizeExactName(item.getDrugName());
            PharmacyInventoryItem inv = inventoryByExactName.get(key);
            if (inv == null) {
                inv = findCaseSensitiveBaseMatch(item.getDrugName(), inventoryItems);
            }
            if (inv == null) {
                inv = findApproximateBaseMatch(item.getDrugName(), inventoryItems);
            }
            if (inv != null && inv.getStockQuantity() != null && inv.getStockQuantity() > 0) {
                row.setAvailable(true);
                row.setInventoryName(inv.getName());
                row.setStockQuantity(inv.getStockQuantity());
                row.setUnitPrice(inv.getUnitPrice());
                row.setImageUrl(inv.getImageUrl());
                availableItems.add(row);
            } else {
                row.setAvailable(false);
                row.setStockQuantity(inv != null && inv.getStockQuantity() != null ? inv.getStockQuantity() : 0);
                unavailableItems.add(row);
            }
        }

        response.setAvailableItems(availableItems);
        response.setUnavailableItems(unavailableItems);
        return response;
    }

    private static String normalizeExactName(String value) {
        return value == null ? "" : value.trim();
    }

    private static PharmacyInventoryItem findCaseSensitiveBaseMatch(String drugName, List<PharmacyInventoryItem> inventoryItems) {
        String drugBase = baseNameCaseSensitive(drugName);
        if (drugBase.isBlank()) {
            return null;
        }
        for (PharmacyInventoryItem item : inventoryItems) {
            String invBase = baseNameCaseSensitive(item.getName());
            if (!invBase.isBlank() && invBase.equals(drugBase)) {
                return item;
            }
        }
        return null;
    }

    private static PharmacyInventoryItem findApproximateBaseMatch(String drugName, List<PharmacyInventoryItem> inventoryItems) {
        String source = baseNameLower(drugName);
        if (source.isBlank()) {
            return null;
        }

        PharmacyInventoryItem best = null;
        int bestDistance = Integer.MAX_VALUE;

        for (PharmacyInventoryItem item : inventoryItems) {
            String candidate = baseNameLower(item.getName());
            if (candidate.isBlank()) continue;
            int distance = levenshteinDistance(source, candidate);
            if (distance < bestDistance) {
                bestDistance = distance;
                best = item;
            }
        }

        // Small tolerance for misspellings (e.g. Amoxcilin -> Amoxicillin).
        return bestDistance <= 2 ? best : null;
    }

    private static String baseNameCaseSensitive(String value) {
        if (value == null) return "";
        return value
                .replaceAll("(?i)\\b\\d+(mg|mcg|g|ml)\\b", " ")
                .replaceAll("(?i)\\b(tablet|tablets|capsule|capsules|syrup|injection)\\b", " ")
                .replaceAll("[^A-Za-z]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static String baseNameLower(String value) {
        return baseNameCaseSensitive(value).toLowerCase();
    }

    private static int levenshteinDistance(String a, String b) {
        int n = a.length();
        int m = b.length();
        if (n == 0) return m;
        if (m == 0) return n;

        int[] prev = new int[m + 1];
        int[] curr = new int[m + 1];
        for (int j = 0; j <= m; j++) prev[j] = j;

        for (int i = 1; i <= n; i++) {
            curr[0] = i;
            char ca = a.charAt(i - 1);
            for (int j = 1; j <= m; j++) {
                int cost = (ca == b.charAt(j - 1)) ? 0 : 1;
                curr[j] = Math.min(
                        Math.min(curr[j - 1] + 1, prev[j] + 1),
                        prev[j - 1] + cost
                );
            }
            int[] tmp = prev;
            prev = curr;
            curr = tmp;
        }
        return prev[m];
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
        private List<PrescriptionItemRequest> items;
    }

    @Data
    public static class PrescriptionItemRequest {
        private String drugName;
        private String dosage;
        private String frequency;
        private String duration;
        private String instructions;
    }

    @Data
    public static class PatientPrescriptionResponse {
        private Long id;
        private LocalDate date;
        private String doctorName;
        private String notes;
        private boolean dispensed;
        private java.time.LocalDateTime dispensedAt;
        private List<PatientPrescriptionItemResponse> items = new ArrayList<>();
    }

    @Data
    public static class PatientPrescriptionItemResponse {
        private String drugName;
        private String dosage;
        private String frequency;
        private String duration;
        private String instructions;
    }

    @Data
    public static class AvailabilityCheckResponse {
        private Long prescriptionId;
        private LocalDate date;
        private List<AvailabilityItemResponse> availableItems = new ArrayList<>();
        private List<AvailabilityItemResponse> unavailableItems = new ArrayList<>();
    }

    @Data
    public static class AvailabilityItemResponse {
        private String drugName;
        private String dosage;
        private String frequency;
        private String duration;
        private String instructions;
        private boolean available;
        private Integer stockQuantity;
        private java.math.BigDecimal unitPrice;
        private String imageUrl;
        private String inventoryName;
    }
}
