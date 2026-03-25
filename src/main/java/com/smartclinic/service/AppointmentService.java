package com.smartclinic.service;

import com.smartclinic.model.Appointment;
import com.smartclinic.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import com.smartclinic.model.DoctorProfile;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ClinicHoursService clinicHoursService;

    public List<Appointment> findAll() {
        return appointmentRepository.findAll();
    }

    public List<Appointment> findByPatientId(Long patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }

    public List<Appointment> findByDateAndSession(java.time.LocalDate date, com.smartclinic.model.SessionType session) {
        return appointmentRepository.findByAppointmentDateAndSessionTypeOrderByTokenNumberAsc(date, session);
    }

    public Optional<Appointment> findById(Long id) {
        return appointmentRepository.findById(id);
    }

    public boolean isSlotAvailable(DoctorProfile doctor, LocalDateTime dateTime) {
        return !appointmentRepository.existsByDoctorAndDateTime(doctor, dateTime);
    }

    @Transactional
    public Appointment save(Appointment appointment) {
        // Set LocalDateTime based on appointmentDate and sessionType if not set or if
        // Date/Session changed
        if (appointment.getAppointmentDate() != null && appointment.getSessionType() != null) {
            java.time.LocalTime startTime = clinicHoursService.getSessionStartTime(
                    appointment.getSessionType(),
                    appointment.getAppointmentDate().getDayOfWeek());
            if (startTime != null) {
                appointment.setDateTime(appointment.getAppointmentDate().atTime(startTime));
            }
        }

        // Generate token if new appointment
        if (appointment.getId() == null) {
            // Check capacity
            long count = appointmentRepository.countByDoctorAndAppointmentDateAndSessionType(
                    appointment.getDoctor(),
                    appointment.getAppointmentDate(),
                    appointment.getSessionType());
            if (count >= 50) {
                throw new RuntimeException("This session is full (Max 50 patients).");
            }

            // Check duplicate booking (same doctor in same session)
            if (appointmentRepository.existsByPatientAndDoctorAndAppointmentDateAndSessionType(
                    appointment.getPatient(),
                    appointment.getDoctor(),
                    appointment.getAppointmentDate(),
                    appointment.getSessionType())) {
                throw new RuntimeException("You already have an appointment with this doctor for this session.");
            }

            appointment.setTokenNumber((int) count + 1);
        }

        // Calculate fee if not set
        if (appointment.getPaymentAmount() == null && appointment.getDoctor() != null) {
            appointment.setPaymentAmount(appointment.getDoctor().getConsultationFee());
        }
        return appointmentRepository.save(appointment);
    }

    @Transactional
    public void deleteById(Long id) {
        appointmentRepository.deleteById(id);
    }

    @Transactional
    public void deleteAll() {
        appointmentRepository.deleteAll();
    }
}
