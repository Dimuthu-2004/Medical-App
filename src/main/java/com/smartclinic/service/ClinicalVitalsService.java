package com.smartclinic.service;

import com.smartclinic.model.ClinicalVitals;
import com.smartclinic.model.Patient;
import com.smartclinic.repository.ClinicalVitalsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ClinicalVitalsService {
    private final ClinicalVitalsRepository clinicalVitalsRepository;

    public List<ClinicalVitals> findAll() {
        return clinicalVitalsRepository.findAll();
    }

    public List<ClinicalVitals> findByPatient(Patient patient) {
        return clinicalVitalsRepository.findByPatientOrderByRecordedAtDesc(patient);
    }

    public Optional<ClinicalVitals> findById(Long id) {
        return clinicalVitalsRepository.findById(id);
    }

    public ClinicalVitals save(ClinicalVitals vitals) {
        return clinicalVitalsRepository.save(vitals);
    }

    public void deleteById(Long id) {
        clinicalVitalsRepository.deleteById(id);
    }
}
