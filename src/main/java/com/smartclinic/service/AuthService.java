package com.smartclinic.service;

import com.smartclinic.model.User;
import com.smartclinic.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final com.smartclinic.repository.PatientRepository patientRepository;
    private final com.smartclinic.repository.DoctorProfileRepository doctorProfileRepository;
    private final com.smartclinic.repository.StaffProfileRepository staffProfileRepository;

    @Transactional
    public void registerPatient(User user, com.smartclinic.model.Patient patient) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        user.setRole("PATIENT");
        user = userRepository.save(user); // Save User first to get ID

        patient.setUser(user);
        patientRepository.save(patient);
    }

    @Transactional
    public void registerDoctor(User user, com.smartclinic.model.DoctorProfile doctorProfile) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        user.setRole("DOCTOR");
        user = userRepository.save(user);

        doctorProfile.setUser(user);
        doctorProfileRepository.save(doctorProfile);
    }

    @Transactional
    public void registerStaff(User user, com.smartclinic.model.StaffProfile staffProfile) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        // Role is set in controller or passed in user object (RECEPTIONIST or NURSE)
        // Ensure it's not ADMIN or DOCTOR or PATIENT if strict
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("RECEPTIONIST"); // Default fallback
        }
        user = userRepository.save(user);

        staffProfile.setUser(user);
        staffProfileRepository.save(staffProfile);
    }

    @Transactional
    public void resetPassword(String username, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(newPassword); // In real app, encode this
        userRepository.save(user);
    }
}
