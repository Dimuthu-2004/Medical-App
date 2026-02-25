package com.smartclinic.repository;

import com.smartclinic.model.Feedback;
import com.smartclinic.model.FeedbackStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    Optional<Feedback> findByAppointmentId(Long appointmentId);

    List<Feedback> findByAppointment_Patient_Id(Long patientId);

    List<Feedback> findByAppointment_Doctor_Id(Long doctorId);

    List<Feedback> findByStatus(FeedbackStatus status);
}
