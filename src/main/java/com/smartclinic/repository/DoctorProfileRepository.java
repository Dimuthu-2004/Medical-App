package com.smartclinic.repository;

import com.smartclinic.model.DoctorProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DoctorProfileRepository extends JpaRepository<DoctorProfile, Long> {
    java.util.Optional<DoctorProfile> findByUserUsername(String username);

    java.util.Optional<DoctorProfile> findByUserId(Long userId);

    java.util.List<DoctorProfile> findByFullNameContainingIgnoreCase(String name);
}
