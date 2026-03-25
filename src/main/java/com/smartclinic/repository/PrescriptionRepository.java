package com.smartclinic.repository;

import com.smartclinic.model.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByPatientId(Long patientId);

    @Query("""
            SELECT p FROM Prescription p
            WHERE p.patient.id = :patientId
              AND (p.deletedByPatient = false OR p.deletedByPatient IS NULL)
            ORDER BY p.date DESC
            """)
    List<Prescription> findVisibleByPatientId(@Param("patientId") Long patientId);

    List<Prescription> findByDoctorId(Long doctorId);

    @Query("""
            SELECT p FROM Prescription p
            WHERE p.id = :id
              AND LOWER(p.patient.user.username) = LOWER(:username)
              AND (p.deletedByPatient = false OR p.deletedByPatient IS NULL)
            """)
    Optional<Prescription> findVisibleByIdAndPatientUsername(@Param("id") Long id, @Param("username") String username);
}
