package com.smartclinic.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
public class Announcement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Content is required")
    @Column(columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    private AnnouncementType type = AnnouncementType.INFO;

    // Targeting Criteria (Optional)
    private String targetCondition; // e.g., "Diabetes", "Flu"
    private Integer minAge;
    private Integer maxAge;

    private boolean sendEmail;
    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum AnnouncementType {
        ALERT, EVENT, INFO
    }
}
