package com.smartclinic.repository;

import com.smartclinic.model.ClinicalVitals;
import com.smartclinic.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClinicalVitalsRepository extends JpaRepository<ClinicalVitals, Long> {
    List<ClinicalVitals> findByPatientOrderByRecordedAtDesc(Patient patient);
}
