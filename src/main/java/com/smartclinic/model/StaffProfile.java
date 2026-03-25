package com.smartclinic.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
public class StaffProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @NotBlank(message = "Full Name is required")
    private String fullName;

    @NotBlank(message = "NIC is required")
    private String nic;

    private String phone;
    private String email;

    @NotBlank(message = "Job Role is required")
    private String jobRole; // Nurse, Finance Manager, Pharmacist

    @Column(columnDefinition = "TEXT")
    private String address;

    private String emergencyContact;

    @Column(columnDefinition = "bit NOT NULL DEFAULT 1")
    private boolean available = true;
}
