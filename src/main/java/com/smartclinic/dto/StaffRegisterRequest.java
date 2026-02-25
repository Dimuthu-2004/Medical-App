package com.smartclinic.dto;

import com.smartclinic.model.StaffProfile;
import com.smartclinic.model.User;
import lombok.Data;

@Data
public class StaffRegisterRequest {
    private User user;
    private StaffProfile staffProfile;
    private String confirmPassword;
}
