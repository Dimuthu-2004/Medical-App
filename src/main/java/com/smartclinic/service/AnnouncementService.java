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
    private final PatientNotificationService patientNotificationService;

    public List<Announcement> getAllAnnouncements() {
        return announcementRepository.findAll();
    }

    public List<Announcement> getActiveAnnouncements() {
        return announcementRepository.findByActiveTrueOrderByCreatedAtDesc();
    }

    @Transactional
    public Announcement createAnnouncement(Announcement announcement) {
        Announcement saved = announcementRepository.save(announcement);

        // Removed automatic email sending
        return saved;
    }

    public void deleteAnnouncement(Long id) {
        announcementRepository.deleteById(id);
    }

    @Transactional
    public Announcement updateAnnouncement(Long id, Announcement updated) {
        Announcement existing = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found: " + id));

        existing.setTitle(updated.getTitle());
        existing.setContent(updated.getContent());
        existing.setType(updated.getType());
        existing.setTargetCondition(updated.getTargetCondition());
        existing.setMinAge(updated.getMinAge());
        existing.setMaxAge(updated.getMaxAge());
        existing.setSendEmail(updated.isSendEmail());
        existing.setActive(updated.isActive());

        return announcementRepository.save(existing);
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
                if (p.getDob() == null) {
                    // Patient has no DOB - if we require age targeting, skip them.
                    // But if targets are null/empty, we should probably show it (handled better
                    // below).
                    return false;
                }
                int age = Period.between(p.getDob(), LocalDate.now()).getYears();
                if (a.getMinAge() != null && age < a.getMinAge())
                    return false;
                if (a.getMaxAge() != null && age > a.getMaxAge())
                    return false;
            }

            // 2. Condition Check
            String targetCondition = a.getTargetCondition();
            if (targetCondition != null && !targetCondition.trim().isEmpty()) {
                String condition = targetCondition.toLowerCase().trim();

                // Check Profile Condition
                boolean inProfile = p.getChronicConditions() != null &&
                        p.getChronicConditions().toLowerCase().contains(condition);

                if (inProfile)
                    return true;

                // Check Medical Records
                try {
                    List<com.smartclinic.model.MedicalRecord> records = medicalRecordRepository
                            .findByPatientId(p.getId());
                    if (records != null) {
                        boolean inRecords = records.stream()
                                .anyMatch(rec -> (rec.getDiagnosis() != null
                                        && rec.getDiagnosis().toLowerCase().contains(condition)) ||
                                        (rec.getMedications() != null
                                                && rec.getMedications().toLowerCase().contains(condition)));

                        if (inRecords)
                            return true;
                    }
                } catch (Exception e) {
                    System.err.println("ANNOUNCEMENT SERVICE: Error checking medical records for patient " + p.getId());
                }

                // If we had a target condition and didn't match profile or records, it's NOT
                // relevant
                return false;
            }

            // If no criteria matched (or no criteria specified), it's relevant!
            return true;
        } catch (Exception e) {
            System.err.println("ANNOUNCEMENT SERVICE: Critical error in isRelevant for patient " + p.getId());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Get patients matching the given criteria (all patients if no condition specified)
     */
    public List<Patient> getMatchingPatients(String targetCondition, Integer minAge, Integer maxAge) {
        System.out.println("ANNOUNCEMENT SERVICE: Preview - targetCondition: " + targetCondition + ", minAge: " + minAge + ", maxAge: " + maxAge);
        List<Patient> allPatients = patientRepository.findAll();
        System.out.println("ANNOUNCEMENT SERVICE: Total patients: " + allPatients.size());
        
        List<Patient> matching = allPatients.stream()
                .filter(p -> isPatientMatching(p, targetCondition, minAge, maxAge))
                .collect(Collectors.toList());
        
        System.out.println("ANNOUNCEMENT SERVICE: Matching patients: " + matching.size());
        return matching;
    }

    private boolean isPatientMatching(Patient p, String targetCondition, Integer minAge, Integer maxAge) {
        try {
            // Age Check
            if (minAge != null || maxAge != null) {
                if (p.getDob() == null) {
                    return false;
                }
                int age = Period.between(p.getDob(), LocalDate.now()).getYears();
                if (minAge != null && age < minAge) return false;
                if (maxAge != null && age > maxAge) return false;
            }

            // Condition Check - if no condition specified, include patient
            if (targetCondition == null || targetCondition.trim().isEmpty()) {
                return true;  // No condition filter, so patient matches
            }
            
            String condition = targetCondition.toLowerCase().trim();
            System.out.println("ANNOUNCEMENT SERVICE: Checking patient " + p.getId() + " (" + p.getName() + ") for condition: " + condition);

            // Check Profile Condition
            if (p.getChronicConditions() != null) {
                String chronicLower = p.getChronicConditions().toLowerCase();
                System.out.println("  - ChronicConditions: " + chronicLower);
                if (chronicLower.contains(condition)) {
                    System.out.println("  - MATCH in chronic conditions");
                    return true;
                }
            }

            // Check Medical Records
            try {
                List<com.smartclinic.model.MedicalRecord> records = medicalRecordRepository
                        .findByPatientId(p.getId());
                if (records != null && !records.isEmpty()) {
                    for (com.smartclinic.model.MedicalRecord rec : records) {
                        String diagnosis = rec.getDiagnosis() != null ? rec.getDiagnosis().toLowerCase() : "";
                        String medications = rec.getMedications() != null ? rec.getMedications().toLowerCase() : "";
                        System.out.println("  - Record diagnosis: " + diagnosis + ", medications: " + medications);
                        
                        if (diagnosis.contains(condition) || medications.contains(condition)) {
                            System.out.println("  - MATCH in medical records");
                            return true;
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("ANNOUNCEMENT SERVICE: Error checking medical records for patient " + p.getId());
                e.printStackTrace();
            }

            System.out.println("  - NO MATCH");
            return false;
        } catch (Exception e) {
            System.err.println("ANNOUNCEMENT SERVICE: Critical error in isPatientMatching for patient " + p.getId());
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

        // In-app notifications should mirror announcement broadcast recipients.
        patientNotificationService.createAnnouncementNotifications(announcement, targets);

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

    /**
     * Send announcement emails to specific patients
     */
    public void sendAnnouncementEmailsToPatients(Announcement announcement, List<Long> patientIds) {
        System.out.println("ANNOUNCEMENT SERVICE: Starting selective email broadcast for: " + announcement.getTitle());
        List<Patient> targets = patientRepository.findAllById(patientIds);

        // Same flow as email dispatch: create in-app notifications for selected recipients.
        patientNotificationService.createAnnouncementNotifications(announcement, targets);

        System.out.println("ANNOUNCEMENT SERVICE: Targeted " + targets.size() + " selected patients");

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
