package com.smartclinic.controller;

import com.smartclinic.model.Announcement;
import com.smartclinic.model.Patient;
import com.smartclinic.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/announcements")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnnouncementRestController {

    private final AnnouncementService announcementService;

    @GetMapping
    public List<Announcement> getAll() {
        return announcementService.getAllAnnouncements();
    }

    @PostMapping
    public Announcement create(@RequestBody Announcement announcement) {
        // Set sendEmail to false since we'll handle sending separately
        announcement.setSendEmail(false);
        return announcementService.createAnnouncement(announcement);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        announcementService.deleteAnnouncement(id);
    }

    @PutMapping("/{id}")
    public Announcement update(@PathVariable Long id, @RequestBody Announcement announcement) {
        return announcementService.updateAnnouncement(id, announcement);
    }

    @PostMapping("/preview-patients")
    public List<Patient> previewMatchingPatients(@RequestBody Map<String, Object> criteria) {
        String targetCondition = (String) criteria.get("targetCondition");
        Integer minAge = criteria.get("minAge") != null ? (Integer) criteria.get("minAge") : null;
        Integer maxAge = criteria.get("maxAge") != null ? (Integer) criteria.get("maxAge") : null;
        return announcementService.getMatchingPatients(targetCondition, minAge, maxAge);
    }

    @PostMapping("/{id}/send-to-patients")
    public void sendToSelectedPatients(@PathVariable Long id, @RequestBody List<Long> patientIds) {
        Announcement announcement = announcementService.getAllAnnouncements().stream()
                .filter(a -> a.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Announcement not found"));
        announcementService.sendAnnouncementEmailsToPatients(announcement, patientIds);
    }
}
