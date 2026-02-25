package com.smartclinic.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    private User doctor; // The doctor who prescribed it

    @Column(nullable = false)
    private String medication;

    private String dosage; // e.g., 500mg
    private String frequency; // e.g., Twice daily, Every 8 hours
    private String duration; // e.g., 5 days

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(columnDefinition = "TEXT")
    private String notes; // Extra clinical notes

    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;
}
