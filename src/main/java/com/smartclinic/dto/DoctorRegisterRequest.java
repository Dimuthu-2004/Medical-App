package com.smartclinic.dto;

import com.smartclinic.model.DoctorProfile;
import com.smartclinic.model.User;
import lombok.Data;

@Data
public class DoctorRegisterRequest {
    private User user;
    private DoctorProfile doctorProfile;
    private String confirmPassword;
}
