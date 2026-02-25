package com.smartclinic.service;

import com.smartclinic.model.Announcement;
import com.smartclinic.model.Patient;
import com.smartclinic.repository.AnnouncementRepository;
import com.smartclinic.repository.PatientRepository;
import com.smartclinic.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final PatientRepository patientRepository;
    private final EmailService emailService;
    private final MedicalRecordRepository medicalRecordRepository;

    public List<Announcement> getAllAnnouncements() {
        return announcementRepository.findAll();
    }

    public List<Announcement> getActiveAnnouncements() {
        return announcementRepository.findByActiveTrueOrderByCreatedAtDesc();
    }

    @Transactional
    public Announcement createAnnouncement(Announcement announcement) {
        Announcement saved = announcementRepository.save(announcement);

        if (saved.isSendEmail()) {
            // Trigger email sending
            sendAnnouncementEmails(saved);
        }

        return saved;
    }

    public void deleteAnnouncement(Long id) {
        announcementRepository.deleteById(id);
    }

    /**
     * Filter active announcements relevant for a specific patient
     */
    public List<Announcement> getAnnouncementsForPatient(Patient patient) {
        List<Announcement> allActive = getActiveAnnouncements();
        return allActive.stream().filter(a -> isRelevant(a, patient)).collect(Collectors.toList());
    }

    private boolean isRelevant(Announcement a, Patient p) {
        try {
            // 1. Age Check
            if (a.getMinAge() != null || a.getMaxAge() != null) {
                if (p.getDob() == null)
                    return false; // Cannot determine age
                int age = Period.between(p.getDob(), LocalDate.now()).getYears();
                if (a.getMinAge() != null && age < a.getMinAge())
                    return false;
                if (a.getMaxAge() != null && age > a.getMaxAge())
                    return false;
            }

            // 2. Condition Check (Optional)
            if (a.getTargetCondition() != null && !a.getTargetCondition().trim().isEmpty()) {
                String condition = a.getTargetCondition().toLowerCase().trim();

                // Check Profile Condition
                boolean inProfile = p.getChronicConditions() != null &&
                        p.getChronicConditions().toLowerCase().contains(condition);

                if (inProfile)
                    return true;

                // Check Medical Records
                try {
                    boolean inRecords = medicalRecordRepository.findByPatientId(p.getId()).stream()
                            .anyMatch(rec -> (rec.getDiagnosis() != null
                                    && rec.getDiagnosis().toLowerCase().contains(condition)) ||
                                    (rec.getMedications() != null
                                            && rec.getMedications().toLowerCase().contains(condition)));

                    return inRecords;
                } catch (Exception e) {
                    System.err.println("ANNOUNCEMENT SERVICE: Error checking medical records for patient " + p.getId());
                    return false;
                }
            }

            return true;
        } catch (Exception e) {
            System.err.println("ANNOUNCEMENT SERVICE: Critical error in isRelevant for patient " + p.getId());
            e.printStackTrace();
            return false;
        }
    }

    private void sendAnnouncementEmails(Announcement announcement) {
        System.out.println("ANNOUNCEMENT SERVICE: Starting email broadcast for: " + announcement.getTitle());
        List<Patient> allPatients = patientRepository.findAll();
        List<Patient> targets = allPatients.stream()
                .filter(p -> {
                    try {
                        return isRelevant(announcement, p);
                    } catch (Exception e) {
                        return false;
                    }
                })
                .collect(Collectors.toList());

        System.out.println(
                "ANNOUNCEMENT SERVICE: Targeted " + targets.size() + " out of " + allPatients.size() + " patients");

        for (Patient p : targets) {
            if (p.getEmail() != null && !p.getEmail().isEmpty()) {
                try {
                    emailService.sendSimpleEmail(
                            p.getEmail(),
                            "SmartClinic Alert: " + announcement.getTitle(),
                            announcement.getContent() + "\n\n" + "To view more details, login to your dashboard.");
                } catch (Exception e) {
                    System.err.println("ANNOUNCEMENT SERVICE: Failed to send alert email to " + p.getEmail());
                    e.printStackTrace();
                }
            }
        }
    }
}
