package com.smartclinic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class SmartClinicApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartClinicApplication.class, args);
    }

    @Bean
    public CommandLineRunner schemaFix(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                // Manually add columns if they don't exist, as nullable
                jdbcTemplate.execute(
                        "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('appointment') AND name = 'appointment_date') "
                                +
                                "ALTER TABLE appointment ADD appointment_date date NULL");
                jdbcTemplate.execute(
                        "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('appointment') AND name = 'session_type') "
                                +
                                "ALTER TABLE appointment ADD session_type varchar(255) NULL");
                jdbcTemplate.execute(
                        "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('appointment') AND name = 'token_number') "
                                +
                                "ALTER TABLE appointment ADD token_number int NULL");

                // Populate legacy data if needed
                jdbcTemplate.execute(
                        "UPDATE appointment SET appointment_date = CAST(date_time AS DATE) WHERE appointment_date IS NULL AND date_time IS NOT NULL");
            } catch (Exception e) {
                System.out.println("Schema fix applied or already exists: " + e.getMessage());
            }
        };
    }

    @Bean
    public CommandLineRunner cleanupLegacyAppointments(
            com.smartclinic.repository.AppointmentRepository repo) {
        return args -> {
            // Remove appointments with no doctor (legacy dummy data)
            java.util.List<com.smartclinic.model.Appointment> bad = repo.findAll().stream()
                    .filter(a -> a.getDoctor() == null)
                    .toList();
            if (!bad.isEmpty()) {
                System.out.println("Cleaning up " + bad.size() + " legacy appointments...");
                repo.deleteAll(bad);
            }
        };
    }
}
