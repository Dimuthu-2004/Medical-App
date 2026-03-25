package com.smartclinic.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import com.smartclinic.model.Appointment;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class BillingService {

    public byte[] generateBillText(Appointment appt) {
        StringBuilder sb = new StringBuilder();
        sb.append("==========================================\n");
        sb.append("             SMART CLINIC                 \n");
        sb.append("           PATIENT INVOICE                \n");
        sb.append("==========================================\n\n");
        sb.append("Invoice ID: INV-").append(String.format("%05d", appt.getId())).append("\n");
        String dateStr = appt.getDateTime() != null
                ? appt.getDateTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                : (appt.getAppointmentDate() != null ? appt.getAppointmentDate().toString() : "N/A");
        sb.append("Date: ").append(dateStr).append("\n\n");
        sb.append("Patient: ").append(appt.getPatient().getName()).append("\n");
        sb.append("Doctor: ").append(appt.getDoctor() != null ? "Dr. " + appt.getDoctor().getFullName() : "N/A")
                .append("\n");
        sb.append("Token Number: #").append(appt.getTokenNumber()).append("\n\n");
        sb.append("------------------------------------------\n");
        sb.append("Total Amount: LKR ").append(appt.getPaymentAmount() != null ? appt.getPaymentAmount() : "1500.00")
                .append("\n");
        sb.append("Status: ").append(Boolean.TRUE.equals(appt.getPaid()) ? "PAID" : "PENDING").append("\n");
        sb.append("------------------------------------------\n\n");
        sb.append("Thank you for choosing SmartClinic.\n");
        sb.append("Get well soon!\n");
        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    public byte[] generateBillPdf(Appointment appt) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A5);
            PdfWriter.getInstance(document, out);
            document.open();

            // Font Styles
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9);

            // Title
            Paragraph title = new Paragraph("SMART CLINIC", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            Paragraph subTitle = new Paragraph("Patient Invoice", headerFont);
            subTitle.setAlignment(Element.ALIGN_CENTER);
            subTitle.setSpacingAfter(20);
            document.add(subTitle);

            // Invoice Info
            document.add(new Paragraph("Invoice ID: INV-" + String.format("%05d", appt.getId()), headerFont));
            String dateStr = appt.getDateTime() != null
                    ? appt.getDateTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                    : (appt.getAppointmentDate() != null ? appt.getAppointmentDate().toString() : "N/A");
            document.add(new Paragraph("Date: " + dateStr, normalFont));
            document.add(new Paragraph(" "));

            // Details
            document.add(new Paragraph("Patient: " + appt.getPatient().getName(), normalFont));
            document.add(new Paragraph("Doctor: "
                    + (appt.getDoctor() != null ? "Dr. " + appt.getDoctor().getFullName() : "General Consultation"),
                    normalFont));
            document.add(new Paragraph("Token Number: #" + appt.getTokenNumber(), normalFont));
            document.add(new Paragraph(" "));

            // Table Simulation
            document.add(new Paragraph("----------------------------------------------------------------", normalFont));
            Paragraph amountPara = new Paragraph(
                    "Total Amount: LKR " + (appt.getPaymentAmount() != null ? appt.getPaymentAmount() : "1500.00"),
                    headerFont);
            amountPara.setAlignment(Element.ALIGN_RIGHT);
            document.add(amountPara);

            Paragraph statusPara = new Paragraph(
                    "Status: " + (Boolean.TRUE.equals(appt.getPaid()) ? "PAID" : "PENDING"), headerFont);
            statusPara.setAlignment(Element.ALIGN_RIGHT);
            document.add(statusPara);
            document.add(new Paragraph("----------------------------------------------------------------", normalFont));

            // Footer
            document.add(new Paragraph(" "));
            Paragraph footer = new Paragraph("Thank you for choosing SmartClinic. Get well soon!", footerFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF", e);
        }
    }
}
