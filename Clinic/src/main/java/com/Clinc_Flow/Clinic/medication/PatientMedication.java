package com.Clinc_Flow.Clinic.medication;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "patient_medications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PatientMedication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "medicine_name", nullable = false, length = 100)
    private String medicineName;

    @Column(nullable = false)
    private Integer quantity;

    @Column(length = 50)
    private String dosage;

    @Column(name = "timing_category", nullable = false, length = 20)
    private String timingCategory; // BREAKFAST, LUNCH, DINNER

    @Column(name = "relation_to_meal", nullable = false, length = 20)
    private String relationToMeal; // BEFORE_MEAL, AFTER_MEAL

    @Column(name = "special_instruction", length = 255)
    private String specialInstruction; // Take with water, etc.

    @Column(name = "doctor_name", length = 100)
    private String doctorName;

    @Column(name = "last_taken_at")
    private OffsetDateTime lastTakenAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
        if (dosage == null) dosage = "1 tablet";
        if (specialInstruction == null) specialInstruction = "Take with water";
        if (quantity == null) quantity = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
