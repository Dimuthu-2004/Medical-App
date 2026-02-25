package com.smartclinic.repository;

import com.smartclinic.model.MedicalRecord;
import com.smartclinic.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {
    List<MedicalRecord> findByPatientOrderByRecordDateDesc(Patient patient);

    List<MedicalRecord> findByPatientId(Long patientId);
}
