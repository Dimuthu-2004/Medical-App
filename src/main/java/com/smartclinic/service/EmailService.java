package com.smartclinic.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.springframework.scheduling.annotation.Async;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    public EmailService(JavaMailSender mailSender, TemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    private boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty())
            return false;
        String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$";
        return java.util.regex.Pattern.compile(emailRegex).matcher(email.trim()).matches();
    }

    @Async
    public void sendSimpleEmail(String to, String subject, String text) {
        if (!isValidEmail(to)) {
            System.err.println("EMAIL SERVICE: Skipping send. Invalid or non-email identifier: " + to);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("drdilinifonseka@gmail.com");
            message.setTo(to.trim());
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            System.out.println("EMAIL SERVICE: Simple email sent successfully to " + to);
        } catch (Exception e) {
            System.err.println(
                    "EMAIL SERVICE ERROR: Could not send simple email to " + to + ". Reason: " + e.getMessage());
        }
    }

    @Async
    public void sendHtmlEmail(String to, String subject, String templateName, Context context) {
        if (!isValidEmail(to)) {
            System.err.println("EMAIL SERVICE: Skipping HTML send. Invalid or non-email identifier: " + to);
            return;
        }
        try {
            String htmlContent = templateEngine.process("emails/" + templateName, context);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("drdilinifonseka@gmail.com");
            helper.setTo(to.trim());
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            System.out.println("EMAIL SERVICE: HTML email (" + templateName + ") sent successfully to " + to);
        } catch (Exception e) {
            System.err
                    .println("EMAIL SERVICE ERROR: Could not send HTML email to " + to + ". Reason: " + e.getMessage());
            // No longer throwing RuntimeException to avoid blocking the main thread/caller
        }
    }
}
