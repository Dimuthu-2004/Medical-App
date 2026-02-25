package com.smartclinic.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
public class DoctorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @NotBlank(message = "Full Name is required")
    private String fullName;

    @NotBlank(message = "SLMC Registration No is required")
    private String slmcNumber;

    @NotBlank(message = "Specialization is required")
    private String specialization;

    private String phone;
    private String email;
    private String clinicName;

    @Column(precision = 10, scale = 2)
    private java.math.BigDecimal consultationFee;

    @Column(columnDefinition = "bit NOT NULL DEFAULT 1")
    private boolean available = true;
}
