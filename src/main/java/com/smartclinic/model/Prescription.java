package com.smartclinic.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.util.ArrayList;
import java.util.List;
import java.time.LocalDate;
import java.time.LocalDateTime;

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

    private Boolean dispensed = false;

    private LocalDateTime dispensedAt;

    private Boolean deletedByPatient = false;

    private LocalDateTime deletedByPatientAt;

    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("id ASC")
    @JsonManagedReference
    private List<PrescriptionItem> items = new ArrayList<>();
}
