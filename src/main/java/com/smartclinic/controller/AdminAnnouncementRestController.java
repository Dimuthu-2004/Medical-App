package com.smartclinic.controller;

import com.smartclinic.model.Announcement;
import com.smartclinic.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
        return announcementService.createAnnouncement(announcement);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        announcementService.deleteAnnouncement(id);
    }
}
