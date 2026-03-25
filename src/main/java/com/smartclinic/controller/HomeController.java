package com.smartclinic.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "forward:/index.html";
    }

    @GetMapping("/login")
    public String login() {
        return "forward:/index.html";
    }

    /** Forward all other routes to React index.html for SPA routing */
    @GetMapping({
            "/register/**",
            "/forgot-password",
            "/ocr",
            "/admin/**",
            "/patients/**",
            "/doctor/**",
            "/staff/**",
            "/pharmacy/**",
            "/appointments/**",
            "/medical-records/**",
            "/vitals/**",
            "/consultations/**",
            "/finance/**",
            "/payment/**",
            "/feedback/**",
            "/ai/**",
            "/skin-scan",
            "/medview/**"
    })
    public String forwardToReact() {
        return "forward:/index.html";
    }
}
