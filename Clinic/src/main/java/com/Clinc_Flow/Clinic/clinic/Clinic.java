package com.Clinc_Flow.Clinic.clinic;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "clinics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Clinic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(name = "logo_path", length = 500)
    private String logoPath;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 100)
    private String country;

    @Column(length = 20)
    private String pincode;

    @Column(name = "gst_number", length = 50)
    private String gstNumber;

    @Column(name = "registration_number", length = 100)
    private String registrationNumber;

    @Column(name = "working_hours", columnDefinition = "TEXT")
    private String workingHours;

    @Column(name = "consultation_fees", precision = 10, scale = 2)
    private BigDecimal consultationFees;

    @Column(name = "clinic_specialization", length = 200)
    private String clinicSpecialization;

    @Column(name = "social_media_links", columnDefinition = "TEXT")
    private String socialMediaLinks;

    @Column(name = "time_zone", length = 50)
    private String timeZone;

    @Column(length = 10)
    private String currency;

    @Column(name = "appointment_duration")
    private Integer appointmentDuration;

    @Column(name = "sms_enabled")
    private Boolean smsEnabled;

    @Column(name = "whatsapp_enabled")
    private Boolean whatsappEnabled;

    @Column(name = "email_notifications_enabled")
    private Boolean emailNotificationsEnabled;

    @Column(name = "is_verified")
    private Boolean isVerified;

    @Column(name = "clinic_admin_user_id")
    private Long clinicAdminUserId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
        if (currency == null) currency = "INR";
        if (appointmentDuration == null) appointmentDuration = 15;
        if (smsEnabled == null) smsEnabled = false;
        if (whatsappEnabled == null) whatsappEnabled = false;
        if (emailNotificationsEnabled == null) emailNotificationsEnabled = false;
        if (isVerified == null) isVerified = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
