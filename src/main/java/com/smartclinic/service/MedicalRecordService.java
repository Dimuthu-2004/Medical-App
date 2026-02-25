package com.smartclinic.service;

import com.smartclinic.model.MedicalRecord;
import com.smartclinic.model.Patient;
import com.smartclinic.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {
    private final MedicalRecordRepository medicalRecordRepository;

    public List<MedicalRecord> findAll() {
        return medicalRecordRepository.findAll();
    }

    public List<MedicalRecord> findByPatient(Patient patient) {
        return medicalRecordRepository.findByPatientOrderByRecordDateDesc(patient);
    }

    public Optional<MedicalRecord> findById(Long id) {
        return medicalRecordRepository.findById(id);
    }

    public MedicalRecord save(MedicalRecord record) {
        return medicalRecordRepository.save(record);
    }

    public void deleteById(Long id) {
        medicalRecordRepository.deleteById(id);
    }
}
