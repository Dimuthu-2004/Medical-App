package com.smartclinic.service;

import com.smartclinic.model.Appointment;
import com.smartclinic.model.AppointmentStatus;
import com.smartclinic.model.Patient;
import com.smartclinic.model.User;
import com.smartclinic.repository.AppointmentRepository;
import com.smartclinic.repository.PatientRepository;
import com.smartclinic.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserService {

    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    @PostConstruct
    public void initData() {
        // Initialize Users
        createUserIfNotFound("admin", "password", "ADMIN");
        createUserIfNotFound("doctor", "password", "DOCTOR");
        createUserIfNotFound("finance", "password", "PAYMENT_MANAGER");
        createUserIfNotFound("patient", "password", "PATIENT");

        // Initialize Sample Data logic
        if (patientRepository.count() == 0) {
            Patient p1 = new Patient();
            p1.setName("John Doe");
            p1.setPhone("555-0101");
            p1.setEmail("john.doe@example.com");
            p1.setDob(LocalDate.of(1985, 3, 15));
            p1.setAddress("123 Main St, Springfield");
            patientRepository.save(p1);

            Patient p2 = new Patient();
            p2.setName("Jane Smith");
            p2.setPhone("555-0102");
            p2.setEmail("jane.smith@example.com");
            p2.setDob(LocalDate.of(1990, 7, 22));
            p2.setAddress("456 Elm St, Shelbyville");
            patientRepository.save(p2);

            Appointment a1 = new Appointment();
            a1.setPatient(p1);
            a1.setDateTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0));
            a1.setStatus(AppointmentStatus.PENDING);
            a1.setNotes("Regular checkup");
            appointmentRepository.save(a1);

            Appointment a2 = new Appointment();
            a2.setPatient(p2);
            a2.setDateTime(LocalDateTime.now().plusDays(2).withHour(14).withMinute(30));
            a2.setStatus(AppointmentStatus.CONFIRMED);
            a2.setNotes("Follow-up visit");
            appointmentRepository.save(a2);
        }
    }

    private void createUserIfNotFound(String username, String password, String role) {
        if (userRepository.findByUsername(username).isEmpty()) {
            User user = new User();
            user.setUsername(username);
            user.setPassword(password);
            user.setRole(role);
            userRepository.save(user);
        }
    }
}
