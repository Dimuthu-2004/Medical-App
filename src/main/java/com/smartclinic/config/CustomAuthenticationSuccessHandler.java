package com.smartclinic.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Set;

@Component
public class CustomAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        // Check for redirectTo parameter in request or session
        String redirectTo = request.getParameter("redirectTo");
        if (redirectTo != null && !redirectTo.isEmpty() && redirectTo.startsWith("/")) {
            response.sendRedirect(redirectTo);
            return;
        }

        Set<String> roles = AuthorityUtils.authorityListToSet(authentication.getAuthorities());

        if (roles.contains("ROLE_ADMIN")) {
            response.sendRedirect("/admin/dashboard");
        } else if (roles.contains("ROLE_DOCTOR")) {
            response.sendRedirect("/doctor/dashboard");
        } else if (roles.contains("ROLE_PATIENT")) {
            response.sendRedirect("/patients/dashboard");
        } else if (roles.contains("ROLE_PAYMENT_MANAGER")) {
            response.sendRedirect("/finance/dashboard");
        } else if (roles.contains("ROLE_RECEPTIONIST") || roles.contains("ROLE_NURSE")
                || roles.contains("ROLE_STAFF")) {
            response.sendRedirect("/staff/dashboard");
        } else {
            response.sendRedirect("/");
        }
    }
}
