package com.Clinc_Flow.Clinic.staff;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "doctor_staff", uniqueConstraints = {
    @UniqueConstraint(columnNames = "staff_user_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DoctorStaff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "doctor_user_id", nullable = false)
    private Long doctorUserId;

    @Column(name = "staff_user_id", nullable = false, unique = true)
    private Long staffUserId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = OffsetDateTime.now(); }
}
