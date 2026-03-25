package com.smartclinic.controller;

import com.smartclinic.model.Appointment;
import com.smartclinic.repository.AppointmentRepository;
import com.smartclinic.service.BillingService;
import com.smartclinic.service.EmailService;
import com.smartclinic.service.FileStorageService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.thymeleaf.context.Context;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/finance")
@RequiredArgsConstructor
public class FinanceRestController {

    private final AppointmentRepository appointmentRepository;
    private final EmailService emailService;
    private final BillingService billingService;
    private final FileStorageService fileStorageService;

    @Value("${app.finance.slip-replace-window-minutes:15}")
    private long slipReplaceWindowMinutes;

    @Value("${app.finance.slip-max-size-bytes:5242880}")
    private long slipMaxSizeBytes;

    @GetMapping("/appointments")
    @PreAuthorize("hasRole('FINANCE_MANAGER')")
    public List<Appointment> getAppointments() {
        List<Appointment> appts = appointmentRepository.findAll();
        System.out.println("DEBUG: getAppointments - Found: " + appts.size());
        appts.stream()
                .filter(a -> a.getPaymentSlipPath() != null)
                .forEach(a -> System.out.println(
                        "DEBUG: getAppointments - Appt ID: " + a.getId() + " has slip: " + a.getPaymentSlipPath()));
        return appts;
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('FINANCE_MANAGER')")
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
    @PreAuthorize("hasRole('FINANCE_MANAGER')")
    public ResponseEntity<?> updatePayment(@RequestBody PaymentUpdateRequest request) {
        Appointment appt = appointmentRepository.findById(request.getAppointmentId()).orElseThrow();
        appt.setPaymentAmount(request.getAmount());
        appt.setPaid(request.isPaid());
        appointmentRepository.save(appt);
        return ResponseEntity.ok(Map.of("message", "Payment updated successfully"));
    }

    @PostMapping("/verify-slip")
    @PreAuthorize("hasRole('FINANCE_MANAGER')")
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

    // -------------------------
    // Bill Endpoints
    // -------------------------

    @GetMapping("/bill/{id}")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER', 'PATIENT')")
    public ResponseEntity<Map<String, Object>> getBillData(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Appointment appt = appointmentRepository.findById(id).orElseThrow();

        // Patients can only view their own bills; finance managers can view all.
        if (isPatient(userDetails) && !ownsAppointment(userDetails, appt)) {
            return ResponseEntity.status(403).build();
        }

        Map<String, Object> bill = new HashMap<>();
        bill.put("invoiceId", appt.getId());
        bill.put("patientName", appt.getPatient().getName());
        bill.put("doctorName", appt.getDoctor() != null ? appt.getDoctor().getFullName() : "N/A");
        bill.put("date", appt.getDateTime() != null ? appt.getDateTime().toLocalDate().toString()
                : (appt.getAppointmentDate() != null ? appt.getAppointmentDate().toString() : "N/A"));
        bill.put("amount", appt.getPaymentAmount() != null ? appt.getPaymentAmount() : BigDecimal.ZERO);
        bill.put("paid", Boolean.TRUE.equals(appt.getPaid()));
        bill.put("status", appt.getStatus() != null ? appt.getStatus().name() : "N/A");
        bill.put("paymentSlipPath", appt.getPaymentSlipPath());
        bill.put("paymentSlipUploadedAt", appt.getPaymentSlipUploadedAt());
        bill.put("slipCanReplace", canUploadOrReplaceSlip(appt, LocalDateTime.now()));
        bill.put("slipReplaceWindowMinutes", Math.max(1, slipReplaceWindowMinutes));
        bill.put("slipReplaceMinutesLeft", replacementMinutesLeft(appt, LocalDateTime.now()));
        bill.put("slipMaxSizeBytes", normalizedMaxSlipSizeBytes());
        return ResponseEntity.ok(bill);
    }

    @GetMapping("/bill/download/{id}")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER', 'PATIENT')")
    public ResponseEntity<byte[]> downloadBill(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Appointment appt = appointmentRepository.findById(id).orElseThrow();
        if (isPatient(userDetails) && !ownsAppointment(userDetails, appt)) {
            return ResponseEntity.status(403).build();
        }
        byte[] content = billingService.generateBillPdf(appt);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"bill-" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(content);
    }

    @GetMapping("/bill/download/text/{id}")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER', 'PATIENT')")
    public ResponseEntity<byte[]> downloadBillText(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Appointment appt = appointmentRepository.findById(id).orElseThrow();
        if (isPatient(userDetails) && !ownsAppointment(userDetails, appt)) {
            return ResponseEntity.status(403).build();
        }
        byte[] content = billingService.generateBillText(appt);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"bill-" + id + ".txt\"")
                .contentType(MediaType.TEXT_PLAIN)
                .body(content);
    }

    @PostMapping("/upload-slip")
    @Transactional
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> uploadSlip(@RequestParam("appointmentId") Long appointmentId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        System.out.println("=== UPLOAD-SLIP HIT for appt: " + appointmentId + " ===");
        try {
            Appointment appt = appointmentRepository.findById(appointmentId)
                    .orElseThrow(() -> new RuntimeException("Appointment not found: " + appointmentId));

            if (!ownsAppointment(userDetails, appt)) {
                return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
            }
            if (Boolean.TRUE.equals(appt.getPaid())) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Payment already verified. Slip cannot be changed."));
            }
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Please choose a slip file to upload."));
            }

            long maxSlipSize = normalizedMaxSlipSizeBytes();
            if (file.getSize() > maxSlipSize) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message",
                        "Slip file too large. Maximum allowed size is " + formatMb(maxSlipSize) + " MB."));
            }

            LocalDateTime now = LocalDateTime.now();
            String oldFilename = appt.getPaymentSlipPath();
            boolean replacing = oldFilename != null && !oldFilename.isBlank();
            if (replacing && !canUploadOrReplaceSlip(appt, now)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message",
                        "Slip replacement window has expired. Please contact finance support."));
            }

            System.out.println("DEBUG: Patient: " + (appt.getPatient() != null ? appt.getPatient().getName() : "NULL"));
            System.out.println("DEBUG: Storing file: " + file.getOriginalFilename() + " size: " + file.getSize());
            String filename = fileStorageService.storeSlip(file);

            appt.setPaymentSlipPath(filename);
            if (appt.getPaymentSlipUploadedAt() == null) {
                appt.setPaymentSlipUploadedAt(now);
            }
            Appointment saved = appointmentRepository.saveAndFlush(appt);

            if (replacing && !oldFilename.equals(filename)) {
                try {
                    fileStorageService.deleteSlip(oldFilename);
                } catch (Exception ex) {
                    System.err.println("WARN: Failed to delete replaced slip file: " + ex.getMessage());
                }
            }

            System.out.println("=== SLIP SAVED: " + saved.getPaymentSlipPath() + " for appt " + saved.getId() + " ===");
            return ResponseEntity.ok(Map.of(
                    "message", replacing ? "Slip replaced successfully" : "Slip uploaded successfully",
                    "filename", filename,
                    "replaced", replacing,
                    "slipCanReplace", canUploadOrReplaceSlip(saved, LocalDateTime.now()),
                    "slipReplaceMinutesLeft", replacementMinutesLeft(saved, LocalDateTime.now())
            ));
        } catch (Exception e) {
            System.err.println("=== ERROR in upload-slip: " + e.getClass().getName() + ": " + e.getMessage() + " ===");
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/slips/{filename:.+}")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER', 'PATIENT')")
    public ResponseEntity<org.springframework.core.io.Resource> serveSlip(
            @PathVariable String filename,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            if (isPatient(userDetails)) {
                var apptOpt = appointmentRepository.findByPaymentSlipPath(filename);
                if (apptOpt.isEmpty() || !ownsAppointment(userDetails, apptOpt.get())) {
                    return ResponseEntity.status(403).build();
                }
            }

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

    private static boolean isPatient(UserDetails userDetails) {
        if (userDetails == null) return false;
        return userDetails.getAuthorities().stream().anyMatch(a -> "ROLE_PATIENT".equals(a.getAuthority()));
    }

    private boolean canUploadOrReplaceSlip(Appointment appt, LocalDateTime now) {
        if (appt == null || Boolean.TRUE.equals(appt.getPaid())) return false;
        if (appt.getPaymentSlipPath() == null || appt.getPaymentSlipPath().isBlank()) return true;

        LocalDateTime uploadedAt = appt.getPaymentSlipUploadedAt();
        if (uploadedAt == null) return true; // Legacy rows without timestamp.

        long window = Math.max(1, slipReplaceWindowMinutes);
        return !now.isAfter(uploadedAt.plusMinutes(window));
    }

    private long replacementMinutesLeft(Appointment appt, LocalDateTime now) {
        long window = Math.max(1, slipReplaceWindowMinutes);
        if (appt == null) return 0;
        if (appt.getPaymentSlipPath() == null || appt.getPaymentSlipPath().isBlank()) return window;

        LocalDateTime uploadedAt = appt.getPaymentSlipUploadedAt();
        if (uploadedAt == null) return window;

        long elapsed = ChronoUnit.MINUTES.between(uploadedAt, now);
        return Math.max(0, window - elapsed);
    }

    private static boolean ownsAppointment(UserDetails userDetails, Appointment appt) {
        if (userDetails == null || appt == null || appt.getPatient() == null || appt.getPatient().getUser() == null) {
            return false;
        }
        return Objects.equals(appt.getPatient().getUser().getUsername(), userDetails.getUsername());
    }

    private long normalizedMaxSlipSizeBytes() {
        return Math.max(1L, slipMaxSizeBytes);
    }

    private static String formatMb(long bytes) {
        return String.format("%.2f", bytes / (1024.0 * 1024.0));
    }

    @Data
    public static class PaymentUpdateRequest {
        private Long appointmentId;
        private BigDecimal amount;
        private boolean paid;
    }
}
