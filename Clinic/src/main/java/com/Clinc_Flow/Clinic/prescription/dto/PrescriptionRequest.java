package com.Clinc_Flow.Clinic.prescription.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PrescriptionRequest {
    private Long patientId;
    private Long doctorId;
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
    private List<MedicineEntry> medicines;
    private Boolean generateBill;
    private String paymentMethod;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MedicineEntry {
        private Long inventoryItemId;
        private String medicineName;
        private String dosage;
        private String frequency;
        private String duration;
        private Integer quantity;
        private String instructions;
    }
}
