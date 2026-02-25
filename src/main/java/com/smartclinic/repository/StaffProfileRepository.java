package com.smartclinic.repository;

import com.smartclinic.model.StaffProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StaffProfileRepository extends JpaRepository<StaffProfile, Long> {
    java.util.Optional<StaffProfile> findByUserUsername(String username);

    java.util.Optional<StaffProfile> findByUserId(Long userId);
}
