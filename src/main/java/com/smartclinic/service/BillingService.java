package com.smartclinic.service;

import com.smartclinic.model.Appointment;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;

@Service
public class BillingService {

    public byte[] generateBillPdf(Appointment appointment) {
        // Generating a text file as requested by user ("download as a text file")
        StringBuilder bill = new StringBuilder();
        bill.append("SMART CLINIC - PATIENT INVOICE\n");
        bill.append("================================\n");
        bill.append("Invoice ID: ").append(appointment.getId()).append("\n");
        bill.append("Date: ").append(appointment.getDateTime() != null ? appointment.getDateTime().toLocalDate()
                : appointment.getAppointmentDate()).append("\n");
        bill.append("Patient: ").append(appointment.getPatient().getName()).append("\n");
        bill.append("Doctor Service: General Consultation\n");
        bill.append("--------------------------------\n");
        bill.append("Total Amount: LKR ")
                .append(appointment.getPaymentAmount() != null ? appointment.getPaymentAmount() : BigDecimal.ZERO)
                .append("\n");
        bill.append("Status: ").append(Boolean.TRUE.equals(appointment.getPaid()) ? "PAID" : "UNPAID").append("\n");
        bill.append("================================\n");
        bill.append("Thank you for choosing SmartClinic!");

        return bill.toString().getBytes(StandardCharsets.UTF_8);
    }
}
