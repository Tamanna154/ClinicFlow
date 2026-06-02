package com.Clinc_Flow.Clinic.doctor.letterhead;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "letterheads")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Letterhead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "doctor_id", nullable = false)
    private Long doctorId;

    @Column(name = "clinic_name", length = 255)
    private String clinicName;

    @Column(name = "clinic_address", columnDefinition = "TEXT")
    private String clinicAddress;

    @Column(name = "clinic_phone", length = 20)
    private String clinicPhone;

    @Column(name = "clinic_email", length = 255)
    private String clinicEmail;

    @Column(name = "clinic_logo_path", columnDefinition = "TEXT")
    private String clinicLogoPath;

    @Column(name = "letterhead_design_path", columnDefinition = "TEXT")
    private String letterheadDesignPath;

    @Column(name = "signature_path", columnDefinition = "TEXT")
    private String signaturePath;

    @Column(name = "gst_number", length = 50)
    private String gstNumber;

    @Column(name = "registration_number", length = 100)
    private String registrationNumber;

    @Column(name = "use_system_generated", nullable = false)
    private Boolean useSystemGenerated;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
        if (useSystemGenerated == null) useSystemGenerated = false;
        if (isActive == null) isActive = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
