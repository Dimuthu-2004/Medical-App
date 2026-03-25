package com.smartclinic.repository;

import com.smartclinic.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameIgnoreCase(String username);

    java.util.List<User> findByUsernameContainingIgnoreCase(String username);

    long countByRoleIgnoreCase(String role);
}
