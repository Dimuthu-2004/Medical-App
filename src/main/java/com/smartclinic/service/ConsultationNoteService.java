package com.smartclinic.service;

import com.smartclinic.model.ConsultationNote;
import com.smartclinic.model.Patient;
import com.smartclinic.model.Appointment;
import com.smartclinic.model.Appointment;
import com.smartclinic.model.AppointmentStatus;
import com.smartclinic.repository.AppointmentRepository;
import com.smartclinic.repository.ConsultationNoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ConsultationNoteService {
    private final ConsultationNoteRepository consultationNoteRepository;
    private final AppointmentRepository appointmentRepository;

    public List<ConsultationNote> findAll() {
        return consultationNoteRepository.findAll();
    }

    public List<ConsultationNote> findByPatient(Patient patient) {
        return consultationNoteRepository.findByPatientOrderByConsultationDateDesc(patient);
    }

    public Optional<ConsultationNote> findByAppointment(Appointment appointment) {
        return consultationNoteRepository.findByAppointment(appointment);
    }

    public Optional<ConsultationNote> findById(Long id) {
        return consultationNoteRepository.findById(id);
    }

    public ConsultationNote save(ConsultationNote note) {
        if (note.getAppointment() != null) {
            Appointment appointment = appointmentRepository.findById(note.getAppointment().getId()).orElse(null);
            if (appointment != null) {
                appointment.setStatus(AppointmentStatus.COMPLETED);
                appointmentRepository.save(appointment);
            }
        }
        return consultationNoteRepository.save(note);
    }

    public void deleteById(Long id) {
        consultationNoteRepository.deleteById(id);
    }
}
