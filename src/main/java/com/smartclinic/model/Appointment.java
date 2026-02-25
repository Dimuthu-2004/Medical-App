package com.smartclinic.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    @NotNull(message = "Patient is required")
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = true)
    private DoctorProfile doctor;

    @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime dateTime;

    // Custom setter for dateTime to populate appointmentDate and sessionType for
    // backward compatibility
    public void setDateTime(LocalDateTime dateTime) {
        this.dateTime = dateTime;
        if (dateTime != null) {
            if (this.appointmentDate == null) {
                this.appointmentDate = dateTime.toLocalDate();
            }
            if (this.sessionType == null) {
                // Approximate session based on time
                int hour = dateTime.getHour();
                if (hour < 12)
                    this.sessionType = SessionType.MORNING;
                else
                    this.sessionType = SessionType.EVENING;
            }
        }
    }

    @DateTimeFormat(pattern = "yyyy-MM-dd")
    @Column(name = "appointment_date", nullable = true)
    private LocalDate appointmentDate;

    public void setAppointmentDate(LocalDate appointmentDate) {
        this.appointmentDate = appointmentDate;
        syncDateTime();
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "session_type", nullable = true)
    private SessionType sessionType;

    public void setSessionType(SessionType sessionType) {
        this.sessionType = sessionType;
        syncDateTime();
    }

    private void syncDateTime() {
        if (this.appointmentDate != null && this.sessionType != null && this.dateTime == null) {
            // Cannot easily access service here, but can at least set a default if possible
            // Or leave it to the service layer to avoid circular dependencies
        }
    }

    private Integer tokenNumber;

    @Enumerated(EnumType.STRING)
    private AppointmentStatus status = AppointmentStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private java.math.BigDecimal paymentAmount = new java.math.BigDecimal("1500.00");

    @Column(name = "is_paid", nullable = true)
    private Boolean paid;

    @Column(name = "payment_slip_path", nullable = true)
    private String paymentSlipPath;

    @OneToOne(mappedBy = "appointment", cascade = CascadeType.ALL)
    @JsonManagedReference
    private Feedback feedback;
}
