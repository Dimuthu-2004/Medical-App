package com.smartclinic.config;

import com.smartclinic.repository.DoctorProfileRepository;
import com.smartclinic.repository.StaffProfileRepository;
import com.smartclinic.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DbInspector implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final StaffProfileRepository staffProfileRepository;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("=== DB INSPECTION START ===");
        System.out.println("Users found: " + userRepository.count());
        userRepository.findAll()
                .forEach(u -> System.out.println("User: " + u.getUsername() + ", Role: " + u.getRole()));

        System.out.println("Doctor Profiles found: " + doctorProfileRepository.count());
        doctorProfileRepository.findAll().forEach(d -> System.out.println("Doctor: " + d.getFullName() + ", User: "
                + (d.getUser() != null ? d.getUser().getUsername() : "null")));

        System.out.println("Staff Profiles found: " + staffProfileRepository.count());

        System.out.println("=== DB INSPECTION END ===");
    }
}
