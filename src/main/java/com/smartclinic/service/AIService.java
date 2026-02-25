package com.smartclinic.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AIService {

    public String analyzeSymptoms(String symptoms) {
        // Mock AI logic
        if (symptoms.toLowerCase().contains("fever")) {
            return "Potential diagnosis: Viral Infection or Flu. Recommendation: Rest and hydration.";
        } else if (symptoms.toLowerCase().contains("headache")) {
            return "Potential diagnosis: Migraine or Tension Headache. Recommendation: Check vision and sleep patterns.";
        } else {
            return "Symptoms unclear. Recommendation: Schedule an appointment with a general practitioner.";
        }
    }

    public String checkDrugInteractions(String drug1, String drug2) {
        // Mock AI interaction check
        if (drug1.equalsIgnoreCase("Aspirin") && drug2.equalsIgnoreCase("Warfarin")) {
            return "CRITICAL WARNING: High risk of bleeding. Avoid combination.";
        }
        return "No known major interactions found for " + drug1 + " and " + drug2 + ".";
    }
}
