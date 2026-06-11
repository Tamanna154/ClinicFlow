package com.Clinc_Flow.Clinic.medication;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "patient_meal_timings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PatientMealTimings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id", nullable = false, unique = true)
    private Long patientId;

    @Column(name = "breakfast_time", nullable = false, length = 20)
    private String breakfastTime;

    @Column(name = "lunch_time", nullable = false, length = 20)
    private String lunchTime;

    @Column(name = "dinner_time", nullable = false, length = 20)
    private String dinnerTime;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
        if (breakfastTime == null) breakfastTime = "08:00 AM";
        if (lunchTime == null) lunchTime = "01:30 PM";
        if (dinnerTime == null) dinnerTime = "08:30 PM";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
