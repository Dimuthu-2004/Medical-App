package com.smartclinic;

import com.smartclinic.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DebugDataChecker implements CommandLineRunner {
    private final DoctorProfileRepository doctorRepo;
    private final AppointmentRepository apptRepo;
    private final UserRepository userRepo;

    @Override
    public void run(String... args) {
        System.out.println("--- DB DEBUG START ---");
        System.out.println("Total Users: " + userRepo.count());
        userRepo.findAll().forEach(u -> System.out.println("User: " + u.getUsername() + ", Role: " + u.getRole()));

        System.out.println("Total Doctor Profiles: " + doctorRepo.count());
        doctorRepo.findAll().forEach(d -> {
            long apptCount = apptRepo.findByDoctor(d).size();
            System.out.println("Doctor: " + d.getFullName() + " (ID: " + d.getId() + ") - UserID: "
                    + (d.getUser() != null ? d.getUser().getId() : "null") + " ("
                    + (d.getUser() != null ? d.getUser().getUsername() : "N/A") + ") - Appts: " + apptCount);
        });

        System.out.println("Total Appointments: " + apptRepo.count());
        long orphanedAppts = apptRepo.findAll().stream().filter(a -> a.getDoctor() == null).count();
        System.out.println("Orphaned Appointments (No Doctor): " + orphanedAppts);

        // Optional: Reassign logic for testing
        String targetDocName = System.getProperty("reassign.appts");
        if (targetDocName == null && args != null) {
            for (String arg : args) {
                if (arg.contains("reassign.appts=")) {
                    targetDocName = arg.split("=")[1];
                }
            }
        }

        if (targetDocName != null) {
            final String finalTarget = targetDocName;
            doctorRepo.findAll().stream()
                    .filter(d -> d.getUser() != null && d.getUser().getUsername().equalsIgnoreCase(finalTarget))
                    .findFirst()
                    .ifPresentOrElse(targetDoc -> {
                        System.out.println("DEBUG: REASSIGNING ALL APPOINTMENTS TO: " + targetDoc.getFullName());
                        apptRepo.findAll().forEach(a -> {
                            a.setDoctor(targetDoc);
                            apptRepo.save(a);
                        });
                        System.out.println("DEBUG: Reassignment complete.");
                    }, () -> System.out.println("DEBUG: Reassign target user '" + finalTarget + "' not found."));
        }

        System.out.println("--- DB DEBUG END ---");
    }
}
