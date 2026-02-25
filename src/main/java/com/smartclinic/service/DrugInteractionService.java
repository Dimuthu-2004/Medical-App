package com.smartclinic.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for AI-powered drug interaction check.
 * Uses a Hybrid Engine: Local DB (curated) + OpenFDA (fallback).
 */
@Service
public class DrugInteractionService {

    private static final String RXNAV_BASE = "https://rxnav.nlm.nih.gov/REST";
    private static final String OPENFDA_BASE = "https://api.fda.gov/drug/label.json";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public DrugInteractionService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    private List<Map<String, String>> localInteractions = new ArrayList<>();

    @PostConstruct
    public void init() {
        try {
            InputStream is = new ClassPathResource("drug_interactions.json").getInputStream();
            localInteractions = objectMapper.readValue(is, new TypeReference<List<Map<String, String>>>() {
            });
            System.out.println("DEBUG: Loaded " + localInteractions.size() + " local drug interactions.");
        } catch (Exception e) {
            System.err.println("ERROR: Could not load drug_interactions.json: " + e.getMessage());
        }
    }

    /**
     * Check interaction between two drug names.
     */
    public Map<String, String> checkInteraction(String drug1, String drug2) {
        String d1 = drug1.trim();
        String d2 = drug2.trim();
        System.out.println("DEBUG: checkInteraction called for [" + d1 + "] and [" + d2 + "]");

        // 1. Resolve Canonical Names (handles typos like 'warfirin' -> 'warfarin')
        String canonical1 = resolveCanonicalName(d1);
        String canonical2 = resolveCanonicalName(d2);

        String search1 = (canonical1 != null) ? canonical1.toLowerCase() : d1.toLowerCase();
        String search2 = (canonical2 != null) ? canonical2.toLowerCase() : d2.toLowerCase();

        System.out.println("DEBUG: Normalized search terms: [" + search1 + "] and [" + search2 + "]");

        // 2. Check Local DB (Primary, high accuracy)
        Map<String, String> localResult = findInLocalDb(search1, search2);
        if (localResult != null) {
            Map<String, String> result = new LinkedHashMap<>(localResult);
            result.put("drug1", d1);
            result.put("drug2", d2);
            System.out.println("DEBUG: Local match found for normalized pair.");
            return result;
        }

        // 3. Check OpenFDA Fallback (Text-based search in labels)
        try {
            String openFdaDesc = fetchOpenFdaInteraction(search1, search2);
            if (openFdaDesc != null) {
                String severity = classifySeverity(openFdaDesc);
                return build(d1, d2, severity, openFdaDesc, "INTERACTION_FOUND");
            }
        } catch (Exception e) {
            System.err.println("DEBUG: OpenFDA fallback error: " + e.getMessage());
        }

        return build(d1, d2, "NONE",
                "No known interactions found between " + d1 + " and " + d2 + " in our current safety database.",
                "NO_INTERACTION");
    }

    private Map<String, String> findInLocalDb(String d1, String d2) {
        for (Map<String, String> interaction : localInteractions) {
            String ld1 = interaction.get("drug1").toLowerCase();
            String ld2 = interaction.get("drug2").toLowerCase();
            if ((ld1.equals(d1) && ld2.equals(d2)) || (ld1.equals(d2) && ld2.equals(d1))) {
                return interaction;
            }
        }
        return null;
    }

    private String resolveCanonicalName(String name) {
        // Mode 1: Direct name properties
        String canonical = callRxNormNameApi(name);
        if (canonical != null)
            return canonical;

        // Mode 2: Approximate discovery
        String rxcui = callApproximateTermApi(name);
        if (rxcui != null) {
            return fetchNameByRxcui(rxcui);
        }
        return null;
    }

    private String callRxNormNameApi(String name) {
        try {
            String url = RXNAV_BASE + "/rxcui.json?name=" + encode(name);
            String response = restTemplate.getForObject(url, String.class);
            if (response == null)
                return null;
            JsonNode root = objectMapper.readTree(response);
            JsonNode concept = root.path("idGroup").path("name");
            if (!concept.isMissingNode() && !concept.asText().isBlank()) {
                return concept.asText();
            }
        } catch (Exception e) {
        }
        return null;
    }

    private String callApproximateTermApi(String name) {
        try {
            String url = RXNAV_BASE + "/approximateTerm.json?term=" + encode(name) + "&maxEntries=1";
            String response = restTemplate.getForObject(url, String.class);
            if (response == null)
                return null;
            JsonNode root = objectMapper.readTree(response);
            JsonNode candidate = root.path("approximateGroup").path("candidate");
            if (candidate.isArray() && candidate.size() > 0) {
                return candidate.get(0).path("rxcui").asText(null);
            }
        } catch (Exception e) {
        }
        return null;
    }

    private String fetchNameByRxcui(String rxcui) {
        try {
            String url = RXNAV_BASE + "/rxcui/" + rxcui + "/properties.json";
            String response = restTemplate.getForObject(url, String.class);
            if (response == null)
                return null;
            JsonNode root = objectMapper.readTree(response);
            return root.path("properties").path("name").asText(null);
        } catch (Exception e) {
        }
        return null;
    }

    private String fetchOpenFdaInteraction(String d1, String d2) {
        try {
            String url = OPENFDA_BASE + "?search=openfda.generic_name:\"" + encode(d1) + "\"+AND+drug_interactions:\""
                    + encode(d2) + "\"&limit=1";
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            JsonNode results = root.path("results");
            if (results.isArray() && results.size() > 0) {
                JsonNode interactions = results.get(0).path("drug_interactions");
                if (interactions.isArray() && interactions.size() > 0) {
                    return interactions.get(0).asText();
                } else if (!interactions.isMissingNode()) {
                    return interactions.asText();
                }
            }
        } catch (Exception e) {
        }
        return null;
    }

    private String classifySeverity(String description) {
        String lc = description.toLowerCase();
        if (lc.contains("life-threatening") || lc.contains("contraindicated") || lc.contains("fatal")
                || lc.contains("danger") || lc.contains("severe")) {
            return "SEVERE";
        } else if (lc.contains("monitor") || lc.contains("caution") || lc.contains("moderate") || lc.contains("risk")) {
            return "MODERATE";
        }
        return "MILD";
    }

    private Map<String, String> build(String drug1, String drug2, String severity, String description, String status) {
        Map<String, String> result = new LinkedHashMap<>();
        result.put("drug1", drug1);
        result.put("drug2", drug2);
        result.put("severity", severity);
        if (description != null && description.length() > 500) {
            description = description.substring(0, 497) + "...";
        }
        result.put("description", description);
        result.put("status", status);
        return result;
    }

    private String encode(String value) {
        try {
            return java.net.URLEncoder.encode(value, "UTF-8");
        } catch (Exception e) {
            return value.replace(" ", "%20");
        }
    }
}
