package com.smartclinic.dto;

import com.smartclinic.model.Patient;
import com.smartclinic.model.User;
import lombok.Data;

@Data
public class PatientRegisterRequest {
    private User user;
    private Patient patient;
    private String confirmPassword;
}
