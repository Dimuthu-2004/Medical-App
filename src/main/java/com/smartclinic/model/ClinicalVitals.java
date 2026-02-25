package com.smartclinic.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class ClinicalVitals {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    private LocalDateTime recordedAt;

    private Double weight; // kg
    private Integer systolicBP;
    private Integer diastolicBP;
    private Double temperature; // Celsius
    private Integer heartRate; // bpm
    private Integer respiratoryRate;
    private Double height; // cm

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne
    @JoinColumn(name = "recorded_by_id")
    private User recordedBy;
}
