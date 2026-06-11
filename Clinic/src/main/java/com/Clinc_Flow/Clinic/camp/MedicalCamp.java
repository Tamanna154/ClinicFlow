package com.Clinc_Flow.Clinic.camp;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "medical_camps")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MedicalCamp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "camp_date", nullable = false)
    private LocalDate campDate;

    @Column(nullable = false, length = 255)
    private String location;

    @Column(length = 100)
    private String specialty;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}
