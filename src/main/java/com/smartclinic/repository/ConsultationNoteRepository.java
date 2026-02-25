package com.smartclinic.repository;

import com.smartclinic.model.ConsultationNote;
import com.smartclinic.model.Patient;
import com.smartclinic.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

@Repository
public interface ConsultationNoteRepository extends JpaRepository<ConsultationNote, Long> {
    List<ConsultationNote> findByPatientOrderByConsultationDateDesc(Patient patient);

    Optional<ConsultationNote> findByAppointment(Appointment appointment);

    List<ConsultationNote> findByDoctor(com.smartclinic.model.User doctor);
}
