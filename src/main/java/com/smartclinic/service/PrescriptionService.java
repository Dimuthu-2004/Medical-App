package com.smartclinic.service;

import com.smartclinic.model.Prescription;
import com.smartclinic.model.DoctorProfile;
import com.smartclinic.repository.PrescriptionRepository;
import com.smartclinic.repository.DoctorProfileRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Optional;

@Service
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final DoctorProfileRepository doctorProfileRepository;

    public PrescriptionService(PrescriptionRepository prescriptionRepository,
            DoctorProfileRepository doctorProfileRepository) {
        this.prescriptionRepository = prescriptionRepository;
        this.doctorProfileRepository = doctorProfileRepository;
    }

    public List<Prescription> getByPatientId(Long patientId) {
        return prescriptionRepository.findByPatientId(patientId);
    }

    public List<Prescription> getAll() {
        return prescriptionRepository.findAll();
    }

    public Optional<Prescription> getById(Long id) {
        return prescriptionRepository.findById(id);
    }

    public Prescription save(Prescription p) {
        return prescriptionRepository.save(p);
    }

    public void delete(Long id) {
        prescriptionRepository.deleteById(id);
    }

    public byte[] generatePdf(Long id) {
        Prescription p = prescriptionRepository.findById(id).orElseThrow();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            document.open();

            // Colors
            java.awt.Color primaryBlue = new java.awt.Color(37, 99, 235); // #2563eb
            java.awt.Color secondaryBlue = new java.awt.Color(30, 58, 138); // #1e3a8a
            java.awt.Color lightGray = new java.awt.Color(248, 250, 252); // #f8fafc
            java.awt.Color borderGray = new java.awt.Color(226, 232, 240); // #e2e8f0

            // Font setup
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, primaryBlue);
            Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, secondaryBlue);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            Font warningFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, java.awt.Color.RED);

            // --- Header with Logo ---
            PdfContentByte cb = writer.getDirectContent();
            // Draw heartbeat logo
            cb.setLineWidth(2f);
            cb.setColorStroke(primaryBlue);
            float startX = 40, startY = 800;
            cb.moveTo(startX, startY);
            cb.lineTo(startX + 30, startY);
            cb.lineTo(startX + 40, startY + 15);
            cb.lineTo(startX + 50, startY - 20);
            cb.lineTo(startX + 60, startY + 25);
            cb.lineTo(startX + 70, startY - 5);
            cb.lineTo(startX + 80, startY);
            cb.lineTo(startX + 110, startY);
            cb.stroke();

            Paragraph title = new Paragraph("SMART CLINIC", titleFont);
            title.setAlignment(Element.ALIGN_RIGHT);
            document.add(title);

            Paragraph subHeader = new Paragraph("DIGITAL HEALTHCARE SOLUTIONS",
                    FontFactory.getFont(FontFactory.HELVETICA, 8, primaryBlue));
            subHeader.setAlignment(Element.ALIGN_RIGHT);
            document.add(subHeader);

            document.add(new Paragraph(" "));

            // Horizontal Line
            cb.setLineWidth(1f);
            cb.setColorStroke(borderGray);
            cb.moveTo(40, 770);
            cb.lineTo(555, 770);
            cb.stroke();

            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));

            // --- Info Table (Doctor & Patient) ---
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingBefore(10f);
            infoTable.setSpacingAfter(10f);

            // Doctor Column
            Optional<DoctorProfile> profile = doctorProfileRepository.findByUserId(p.getDoctor().getId());
            String doctorName = profile.map(DoctorProfile::getFullName).orElse(p.getDoctor().getUsername());

            PdfPCell docCell = new PdfPCell();
            docCell.setBorder(Rectangle.NO_BORDER);
            docCell.addElement(new Paragraph("PRESCRIBING DOCTOR", boldFont));
            docCell.addElement(new Paragraph("Dr. " + doctorName.toUpperCase(), subTitleFont));
            if (profile.isPresent()) {
                docCell.addElement(new Paragraph(profile.get().getSpecialization(), normalFont));
                docCell.addElement(new Paragraph(profile.get().getClinicName(), normalFont));
            }
            infoTable.addCell(docCell);

            // Patient/Date Column
            PdfPCell patCell = new PdfPCell();
            patCell.setBorder(Rectangle.NO_BORDER);
            patCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            patCell.addElement(new Paragraph("PATIENT DETAILS", boldFont));
            patCell.addElement(new Paragraph(p.getPatient().getName().toUpperCase(), subTitleFont));
            patCell.addElement(new Paragraph("Date: " + p.getDate(), normalFont));
            patCell.addElement(new Paragraph("Prescription ID: #" + p.getId(), normalFont));
            infoTable.addCell(patCell);

            document.add(infoTable);
            document.add(new Paragraph(" "));

            // --- Prescription Section (Rx) ---
            Paragraph rx = new Paragraph("Rx", FontFactory.getFont(FontFactory.TIMES_BOLDITALIC, 32, primaryBlue));
            document.add(rx);

            PdfPTable medTable = new PdfPTable(1);
            medTable.setWidthPercentage(100);
            PdfPCell medCell = new PdfPCell();
            medCell.setBackgroundColor(lightGray);
            medCell.setBorderColor(borderGray);
            medCell.setPadding(15);

            Paragraph medName = new Paragraph(p.getMedication().toUpperCase(),
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, primaryBlue));
            medCell.addElement(medName);

            Paragraph details = new Paragraph();
            details.setFont(normalFont);
            details.add(new Chunk("\nDosage: ", boldFont));
            details.add(p.getDosage());
            details.add(new Chunk("    Frequency: ", boldFont));
            details.add(p.getFrequency());
            details.add(new Chunk("    Duration: ", boldFont));
            details.add(p.getDuration());
            medCell.addElement(details);

            medCell.addElement(new Paragraph(" "));
            Paragraph inst = new Paragraph();
            inst.add(new Chunk("INSTRUCTIONS: ", boldFont));
            inst.add(p.getInstructions() != null ? p.getInstructions() : "As directed by physician.");
            medCell.addElement(inst);

            medTable.addCell(medCell);
            document.add(medTable);

            if (p.getNotes() != null && !p.getNotes().isEmpty()) {
                document.add(new Paragraph(" "));
                document.add(new Paragraph("CLINICAL NOTES", boldFont));
                document.add(new Paragraph(p.getNotes(), normalFont));
            }

            // --- Footer Section ---
            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));

            PdfPTable footerTable = new PdfPTable(1);
            footerTable.setWidthPercentage(100);
            PdfPCell footerCell = new PdfPCell();
            footerCell.setBackgroundColor(lightGray);
            footerCell.setBorder(Rectangle.BOX);
            footerCell.setBorderColor(primaryBlue);
            footerCell.setPadding(10);

            footerCell.addElement(new Paragraph("SAFETY WARNINGS", warningFont));
            footerCell.addElement(new Paragraph(
                    "• Keep out of reach of children. • Consult doctor if side effects occur. • Complete full course.",
                    FontFactory.getFont(FontFactory.HELVETICA, 8)));

            footerCell.addElement(new Paragraph(" "));

            footerCell.addElement(new Paragraph("CLINIC DISCLAIMER", boldFont));
            footerCell.addElement(new Paragraph(
                    "This is a digitally generated document using Smart Clinic's EMR system. No physical signature is required. Always verify medication at the time of dispensing.",
                    FontFactory.getFont(FontFactory.HELVETICA, 8)));

            footerTable.addCell(footerCell);

            // Push footer to bottom if possible, or just add
            document.add(footerTable);

            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return out.toByteArray();
    }
}
