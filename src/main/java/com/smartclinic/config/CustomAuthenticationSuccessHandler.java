package com.smartclinic.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class CustomAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(CustomAuthenticationSuccessHandler.class);

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        // Check for redirectTo parameter in request or session
        String redirectTo = request.getParameter("redirectTo");
        if ((redirectTo == null || redirectTo.isBlank())) {
            Object sessionRedirect = request.getSession().getAttribute("REDIRECT_TO");
            if (sessionRedirect != null) {
                redirectTo = sessionRedirect.toString();
                request.getSession().removeAttribute("REDIRECT_TO");
            }
        }

        Set<String> roles = AuthorityUtils.authorityListToSet(authentication.getAuthorities())
                .stream()
                .map(this::normalizeAuthority)
                .collect(Collectors.toSet());

        log.info("Auth success: type={}, user={}, roles={}, redirectTo={}",
                authentication.getClass().getSimpleName(),
                authentication.getName(),
                roles,
                redirectTo);

        if (authentication instanceof OAuth2AuthenticationToken) {
            if (redirectTo != null && !redirectTo.isBlank() && redirectTo.startsWith("/") && !"/login".equals(redirectTo)) {
                response.sendRedirect(redirectTo);
            } else {
                response.sendRedirect("/auth/post-login");
            }
            return;
        }

        // Never bounce OAuth users back to /login due stale redirect state.
        if ("/login".equals(redirectTo)) {
            redirectTo = null;
        }
        if (redirectTo != null && !redirectTo.isEmpty() && redirectTo.startsWith("/")) {
            response.sendRedirect(redirectTo);
            return;
        }

        if (roles.contains("ROLE_ADMIN")) {
            response.sendRedirect("/admin/dashboard");
        } else if (roles.contains("ROLE_DOCTOR")) {
            response.sendRedirect("/doctor/dashboard");
        } else if (roles.contains("ROLE_PATIENT")) {
            response.sendRedirect("/patients/dashboard");
        } else if (roles.contains("ROLE_FINANCE_MANAGER") || roles.contains("ROLE_PAYMENT_MANAGER")) {
            response.sendRedirect("/finance/dashboard");
        } else if (roles.contains("ROLE_PHARMACIST")) {
            response.sendRedirect("/pharmacy/dashboard");
        } else if (roles.contains("ROLE_NURSE") || roles.contains("ROLE_STAFF") || roles.contains("ROLE_LAB_TECH")) {
            response.sendRedirect("/staff/dashboard");
        } else if (authentication instanceof OAuth2AuthenticationToken) {
            // For Google sign-in, avoid dead-ending on "/" when legacy role formats are encountered.
            response.sendRedirect("/patients/dashboard");
        } else {
            response.sendRedirect("/");
        }
    }

    private String normalizeAuthority(String authority) {
        if (authority == null) {
            return "";
        }
        return authority.trim().toUpperCase(Locale.ROOT).replaceAll("[\\s-]+", "_");
    }
}
