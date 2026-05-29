package com.Clinc_Flow.Clinic.staff;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "staff_permissions", uniqueConstraints = {
    @UniqueConstraint(columnNames = { "doctor_staff_id", "permission" })
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StaffPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "doctor_staff_id", nullable = false)
    private Long doctorStaffId;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Permission permission;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = OffsetDateTime.now(); }
}
