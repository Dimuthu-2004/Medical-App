package com.smartclinic.service;

import com.smartclinic.model.Appointment;
import com.smartclinic.model.Feedback;
import com.smartclinic.model.FeedbackStatus;
import com.smartclinic.model.Patient;
import com.smartclinic.repository.AppointmentRepository;
import com.smartclinic.repository.FeedbackRepository;
import com.smartclinic.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;

    @Transactional
    public Feedback addFeedback(Long appointmentId, Integer rating, String comment, String username) {
        Patient patient = patientRepository.findByUserUsername(username)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Verify appointment belongs to patient
        if (!appointment.getPatient().getId().equals(patient.getId())) {
            throw new RuntimeException("Unauthorized: Appointment does not belong to this patient");
        }

        // Check if feedback already exists
        if (feedbackRepository.findByAppointmentId(appointmentId).isPresent()) {
            throw new RuntimeException("Feedback already exists for this appointment");
        }

        Feedback feedback = new Feedback();
        feedback.setAppointment(appointment);
        feedback.setRating(rating);
        feedback.setComment(comment);
        // Status is set to APPROVED by default in Entity @PrePersist

        return feedbackRepository.save(feedback);
    }

    @Transactional
    public Feedback updateFeedback(Long feedbackId, Integer rating, String comment, String username) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));

        // Verify ownership
        if (!feedback.getAppointment().getPatient().getUser().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized: You can only edit your own feedback");
        }

        feedback.setRating(rating);
        feedback.setComment(comment);

        return feedbackRepository.save(feedback);
    }

    @Transactional
    public void deleteFeedback(Long feedbackId, String username) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));

        // Verify ownership
        if (!feedback.getAppointment().getPatient().getUser().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized: You can only delete your own feedback");
        }

        // Break relationship if bidirectional
        if (feedback.getAppointment() != null) {
            feedback.getAppointment().setFeedback(null);
            appointmentRepository.save(feedback.getAppointment());
        }

        feedbackRepository.delete(feedback);
    }

    public List<Feedback> getMyFeedbacks(String username) {
        Patient patient = patientRepository.findByUserUsername(username)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        return feedbackRepository.findByAppointment_Patient_Id(patient.getId());
    }

    public List<Feedback> getAllFeedbacks() {
        return feedbackRepository.findAll();
    }

    public List<Feedback> getDoctorFeedbacks(Long doctorId) {
        return feedbackRepository.findByAppointment_Doctor_Id(doctorId);
    }

    @Transactional
    public Feedback adminReply(Long feedbackId, String reply) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));

        feedback.setAdminReply(reply);
        return feedbackRepository.save(feedback);
    }

    @Transactional
    public Feedback updateStatus(Long feedbackId, FeedbackStatus status) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));

        feedback.setStatus(status);
        return feedbackRepository.save(feedback);
    }

    public Feedback getFeedbackById(Long id) {
        return feedbackRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));
    }
}
