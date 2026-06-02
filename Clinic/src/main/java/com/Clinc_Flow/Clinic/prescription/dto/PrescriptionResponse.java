package com.Clinc_Flow.Clinic.prescription.dto;

import com.Clinc_Flow.Clinic.prescription.Prescription;
import com.Clinc_Flow.Clinic.prescription.PrescriptionMedicine;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PrescriptionResponse {
    private Long id;
    private Long consultationId;
    private Long patientId;
    private String patientName;
    private Long doctorId;
    private String doctorName;
    private String symptoms;
    private String diagnosis;
    private String doctorNotes;
    private String bloodPressure;
    private Integer pulseRate;
    private BigDecimal weight;
    private BigDecimal height;
    private BigDecimal temperature;
    private BigDecimal oxygenLevel;
    private LocalDate followUpDate;
    private String followUpNotes;
    private String prescriptionNumber;
    private String status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private List<MedicineResponse> medicines;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MedicineResponse {
        private Long id;
        private String medicineName;
        private String dosage;
        private String frequency;
        private String duration;
        private Integer quantity;
        private String instructions;
        private String medicineType;

        public static MedicineResponse fromEntity(PrescriptionMedicine m) {
            return MedicineResponse.builder()
                .id(m.getId())
                .medicineName(m.getMedicineName())
                .dosage(m.getDosage())
                .frequency(m.getFrequency())
                .duration(m.getDuration())
                .quantity(m.getQuantity())
                .instructions(m.getInstructions())
                .medicineType(m.getMedicineType())
                .build();
        }
    }

    public static PrescriptionResponse fromEntity(Prescription p) {
        PrescriptionResponse resp = PrescriptionResponse.builder()
            .id(p.getId())
            .consultationId(p.getConsultation() != null ? p.getConsultation().getId() : null)
            .patientId(p.getPatientId())
            .doctorId(p.getDoctorId())
            .symptoms(p.getSymptoms())
            .diagnosis(p.getDiagnosis())
            .doctorNotes(p.getDoctorNotes())
            .bloodPressure(p.getBloodPressure())
            .pulseRate(p.getPulseRate())
            .weight(p.getWeight())
            .height(p.getHeight())
            .temperature(p.getTemperature())
            .oxygenLevel(p.getOxygenLevel())
            .followUpDate(p.getFollowUpDate())
            .followUpNotes(p.getFollowUpNotes())
            .prescriptionNumber(p.getPrescriptionNumber())
            .status(p.getStatus())
            .createdAt(p.getCreatedAt())
            .updatedAt(p.getUpdatedAt())
            .medicines(p.getMedicines().stream().map(MedicineResponse::fromEntity).toList())
            .build();

        if (p.getConsultation() != null && p.getConsultation().getAppointment() != null) {
            var a = p.getConsultation().getAppointment();
            resp.setPatientName(a.getPatient() != null ? a.getPatient().getName() : null);
            resp.setDoctorName(a.getDoctor() != null ? a.getDoctor().getName() : null);
        }
        return resp;
    }
}
