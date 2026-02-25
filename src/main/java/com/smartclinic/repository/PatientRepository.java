package com.smartclinic.repository;

import com.smartclinic.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    java.util.List<Patient> findByNameContainingIgnoreCase(String name);

    java.util.List<Patient> findByNameContainingIgnoreCaseOrUserUsernameContainingIgnoreCase(String name,
            String username);

    java.util.Optional<Patient> findByUserId(Long userId);

    java.util.Optional<Patient> findByUserUsername(String username);
}
