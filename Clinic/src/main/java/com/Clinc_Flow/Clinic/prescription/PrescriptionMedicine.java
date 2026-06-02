package com.Clinc_Flow.Clinic.prescription;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "prescription_medicines")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PrescriptionMedicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    @Column(name = "inventory_item_id")
    private Long inventoryItemId;

    @Column(name = "medicine_name", nullable = false, length = 255)
    private String medicineName;

    @Column(length = 100)
    private String dosage;

    @Column(length = 100)
    private String frequency;

    @Column(length = 100)
    private String duration;

    @Column
    private Integer quantity;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "medicine_type", length = 50)
    @Builder.Default
    private String medicineType = "GENERIC";

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}
