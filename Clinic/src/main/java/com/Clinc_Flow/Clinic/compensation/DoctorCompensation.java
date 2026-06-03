package com.Clinc_Flow.Clinic.compensation;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "doctor_compensation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorCompensation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "doctor_id", nullable = false, unique = true)
    private Long doctorId;

    @Enumerated(EnumType.STRING)
    @Column(name = "compensation_type", nullable = false, length = 20)
    private CompensationType compensationType;

    @Column(name = "fixed_salary", precision = 12, scale = 2)
    private BigDecimal fixedSalary;

    @Column(name = "doctor_share_percent", precision = 5, scale = 2)
    private BigDecimal doctorSharePercent;

    @Column(name = "clinic_share_percent", precision = 5, scale = 2)
    private BigDecimal clinicSharePercent;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
        if (isActive == null) isActive = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
