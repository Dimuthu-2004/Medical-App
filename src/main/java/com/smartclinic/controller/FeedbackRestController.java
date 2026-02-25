package com.smartclinic.controller;

import com.smartclinic.model.*;
import com.smartclinic.repository.*;
import com.smartclinic.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackRestController {

    private final FeedbackService feedbackService;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;

    /** Patient: get past appointments (completed) with feedback status */
    @GetMapping("/my-feedbacks")
    public ResponseEntity<List<Map<String, Object>>> getMyFeedbacks(
            @AuthenticationPrincipal UserDetails userDetails) {
        Patient patient = patientRepository.findByUserUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        List<Appointment> pastVisits = appointmentRepository
                .findByPatientAndStatusOrderByDateTimeDesc(patient, AppointmentStatus.COMPLETED);

        List<Map<String, Object>> result = pastVisits.stream().map(appt -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("appointmentId", appt.getId());
            m.put("doctorName",
                    appt.getDoctor() != null ? "Dr. " + appt.getDoctor().getFullName() : "General Consultation");
            m.put("date", appt.getAppointmentDate() != null ? appt.getAppointmentDate().toString()
                    : (appt.getDateTime() != null ? appt.getDateTime().toLocalDate().toString() : "N/A"));
            m.put("tokenNumber", appt.getTokenNumber());
            boolean hasFeedback = appt.getFeedback() != null;
            m.put("hasFeedback", hasFeedback);
            if (hasFeedback) {
                Feedback fb = appt.getFeedback();
                m.put("feedbackId", fb.getId());
                m.put("rating", fb.getRating());
                m.put("comment", fb.getComment());
                m.put("adminReply", fb.getAdminReply());
                m.put("status", fb.getStatus() != null ? fb.getStatus().name() : null);
            }
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /** Patient: submit feedback for a completed appointment */
    @PostMapping("/add/{appointmentId}")
    public ResponseEntity<?> addFeedback(@PathVariable("appointmentId") Long appointmentId,
            @RequestParam("rating") Integer rating,
            @RequestParam("comment") String comment,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            feedbackService.addFeedback(appointmentId, rating, comment, userDetails.getUsername());
            return ResponseEntity.ok(Map.of("message", "Feedback submitted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Patient: update own feedback */
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateFeedback(@PathVariable("id") Long id,
            @RequestParam("rating") Integer rating,
            @RequestParam("comment") String comment,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            feedbackService.updateFeedback(id, rating, comment, userDetails.getUsername());
            return ResponseEntity.ok(Map.of("message", "Feedback updated."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Patient: delete own feedback */
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteFeedback(@PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            feedbackService.deleteFeedback(id, userDetails.getUsername());
            return ResponseEntity.ok(Map.of("message", "Feedback deleted."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Admin: get all feedbacks */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> adminAll() {
        List<Map<String, Object>> result = feedbackService.getAllFeedbacks().stream().map(fb -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", fb.getId());
            m.put("rating", fb.getRating());
            m.put("comment", fb.getComment());
            m.put("adminReply", fb.getAdminReply());
            m.put("status", fb.getStatus() != null ? fb.getStatus().name() : null);
            m.put("patientName", fb.getAppointment() != null && fb.getAppointment().getPatient() != null
                    ? fb.getAppointment().getPatient().getName()
                    : "Unknown");
            m.put("doctorName", fb.getAppointment() != null && fb.getAppointment().getDoctor() != null
                    ? fb.getAppointment().getDoctor().getFullName()
                    : "N/A");
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /** Admin: reply to feedback */
    @PostMapping("/admin/reply/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> adminReply(@PathVariable("id") Long id, @RequestParam("reply") String reply) {
        try {
            feedbackService.adminReply(id, reply);
            return ResponseEntity.ok(Map.of("message", "Reply sent."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
