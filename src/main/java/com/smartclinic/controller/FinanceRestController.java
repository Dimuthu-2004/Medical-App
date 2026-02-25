package com.smartclinic.controller;

import com.smartclinic.model.Appointment;
import com.smartclinic.repository.AppointmentRepository;
import com.smartclinic.service.EmailService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.thymeleaf.context.Context;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finance")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'PAYMENT_MANAGER', 'PATIENT')")
public class FinanceRestController {

    private final AppointmentRepository appointmentRepository;
    private final EmailService emailService;

    @GetMapping("/appointments")
    public List<Appointment> getAppointments() {
        return appointmentRepository.findAll();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        List<Appointment> all = appointmentRepository.findAll();

        BigDecimal totalRevenue = all.stream()
                .filter(a -> Boolean.TRUE.equals(a.getPaid()))
                .map(a -> a.getPaymentAmount() != null ? a.getPaymentAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long pendingCount = all.stream()
                .filter(a -> a.getPaid() == null || !a.getPaid())
                .count();

        long unverifiedSlips = all.stream()
                .filter(a -> a.getPaymentSlipPath() != null && (a.getPaid() == null || !a.getPaid()))
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRevenue", totalRevenue);
        stats.put("pendingPayments", pendingCount);
        stats.put("unverifiedSlips", unverifiedSlips);
        stats.put("totalAppointments", all.size());

        return ResponseEntity.ok(stats);
    }

    @PostMapping("/update-payment")
    public ResponseEntity<?> updatePayment(@RequestBody PaymentUpdateRequest request) {
        Appointment appt = appointmentRepository.findById(request.getAppointmentId()).orElseThrow();
        appt.setPaymentAmount(request.getAmount());
        appt.setPaid(request.isPaid());
        appointmentRepository.save(appt);
        return ResponseEntity.ok(Map.of("message", "Payment updated successfully"));
    }

    @PostMapping("/verify-slip")
    public ResponseEntity<?> verifySlip(@RequestParam("appointmentId") Long appointmentId) {
        Appointment appt = appointmentRepository.findById(appointmentId).orElseThrow();
        appt.setPaid(true);
        appointmentRepository.save(appt);

        Context context = new Context();
        context.setVariable("name", appt.getPatient().getName());
        context.setVariable("appointmentId", appt.getId());
        context.setVariable("time",
                java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));

        try {
            emailService.sendHtmlEmail(appt.getPatient().getEmail(),
                    "Payment Verified: Your Bank Slip was Approved",
                    "slip_verified", context);
        } catch (Exception e) {
            // Log error but return success as DB is updated
            System.err.println("Failed to send verification email: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of("message", "Slip verified successfully"));
    }

    private final com.smartclinic.service.FileStorageService fileStorageService;

    @GetMapping("/slips/{filename:.+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'PAYMENT_MANAGER', 'PATIENT')")
    public ResponseEntity<org.springframework.core.io.Resource> serveSlip(@PathVariable String filename) {
        try {
            java.nio.file.Path filePath = fileStorageService.loadSlip(filename);
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(
                    filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = java.nio.file.Files.probeContentType(filePath);
            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType
                            .parseMediaType(contentType != null ? contentType : "application/octet-stream"))
                    .body(resource);
        } catch (java.io.IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @Data
    public static class PaymentUpdateRequest {
        private Long appointmentId;
        private BigDecimal amount;
        private boolean paid;
    }
}
