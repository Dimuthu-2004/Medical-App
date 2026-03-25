package com.smartclinic.repository;

import com.smartclinic.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.smartclinic.model.DoctorProfile;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
        List<Appointment> findByDateTimeBetween(LocalDateTime start, LocalDateTime end);

        List<Appointment> findByPatientId(Long patientId);

        boolean existsByDoctorAndDateTime(DoctorProfile doctor, LocalDateTime dateTime);

        long countByAppointmentDateAndSessionType(java.time.LocalDate date,
                        com.smartclinic.model.SessionType sessionType);

        long countByDoctorAndAppointmentDateAndSessionType(DoctorProfile doctor,
                        java.time.LocalDate date, com.smartclinic.model.SessionType sessionType);

        boolean existsByPatientAndAppointmentDateAndSessionType(com.smartclinic.model.Patient patient,
                        java.time.LocalDate date, com.smartclinic.model.SessionType sessionType);

        boolean existsByPatientAndDoctorAndAppointmentDateAndSessionType(com.smartclinic.model.Patient patient,
                        DoctorProfile doctor, java.time.LocalDate date, com.smartclinic.model.SessionType sessionType);

        java.util.List<Appointment> findByAppointmentDateAndSessionTypeOrderByTokenNumberAsc(java.time.LocalDate date,
                        com.smartclinic.model.SessionType sessionType);

        java.util.List<Appointment> findByDoctor(DoctorProfile doctor);

        List<Appointment> findByPatientAndStatusOrderByDateTimeDesc(com.smartclinic.model.Patient patient,
                        com.smartclinic.model.AppointmentStatus status);

        Optional<Appointment> findByPaymentSlipPath(String paymentSlipPath);
}
