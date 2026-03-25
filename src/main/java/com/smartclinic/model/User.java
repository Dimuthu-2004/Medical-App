package com.smartclinic.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@Table(name = "app_user") // 'User' is a reserved keyword in MSSQL
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @Column(nullable = false)
    private String role; // ADMIN, DOCTOR, NURSE, PATIENT, FINANCE_MANAGER, PHARMACIST

    @Column(columnDefinition = "TEXT")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String faceEncoding; // Face embeddings (never sent to the browser)

    // Nullable to allow seamless schema evolution on existing MSSQL tables.
    // Treat null as PASSWORD in code.
    @Column(name = "auth_provider")
    private String authProvider = "PASSWORD"; // PASSWORD | FACE | GOOGLE
}
