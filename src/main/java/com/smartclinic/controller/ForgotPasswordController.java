package com.smartclinic.controller;

import com.smartclinic.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequiredArgsConstructor
public class ForgotPasswordController {

    private final AuthService authService;
    private final com.smartclinic.service.EmailService emailService;
    private final com.smartclinic.repository.PatientRepository patientRepository;
    private final com.smartclinic.repository.DoctorProfileRepository doctorRepository;

    @PostMapping("/forgot-password")
    public String processForgotPassword(@RequestParam(value = "username") String username,
            @RequestParam(value = "newPassword") String newPassword,
            @RequestParam(value = "confirmPassword") String confirmPassword,
            Model model) {
        if (!newPassword.equals(confirmPassword)) {
            model.addAttribute("error", "Passwords do not match");
            return "forgot_password";
        }

        try {
            authService.resetPassword(username, newPassword);

            // Try to find a valid email address from profiles
            String recipientEmail = username;
            var patient = patientRepository.findByUserUsername(username);
            if (patient.isPresent() && patient.get().getEmail() != null) {
                recipientEmail = patient.get().getEmail();
            } else {
                var doctor = doctorRepository.findByUserUsername(username);
                if (doctor.isPresent() && doctor.get().getEmail() != null) {
                    recipientEmail = doctor.get().getEmail();
                }
            }

            org.thymeleaf.context.Context context = new org.thymeleaf.context.Context();
            context.setVariable("name", username);
            emailService.sendHtmlEmail(recipientEmail, "Security Update: Password Changed", "password_reset", context);

            return "redirect:/login?resetSuccess";
        } catch (RuntimeException e) {
            return "redirect:/forgot-password?error="
                    + java.net.URLEncoder.encode(e.getMessage(), java.nio.charset.StandardCharsets.UTF_8);
        }
    }
}
