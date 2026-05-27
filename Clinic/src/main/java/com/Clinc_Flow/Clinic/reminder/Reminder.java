package com.Clinc_Flow.Clinic.reminder;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;

@Entity
@Table(name = "reminders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Reminder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "appointment_id", nullable = false)
    private Long appointmentId;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "patient_name", length = 150)
    private String patientName;

    @Column(name = "patient_phone", length = 20)
    private String patientPhone;

    @Column(name = "doctor_name", length = 150)
    private String doctorName;

    @Column(name = "appointment_date")
    private LocalDateTime appointmentDateTime;

    @Column(name = "reminder_time", nullable = false)
    private LocalDateTime reminderTime;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private Boolean sent = false;

    @Column(name = "send_sms", nullable = false)
    private Boolean sendSms = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = OffsetDateTime.now(); updatedAt = OffsetDateTime.now(); }
    @PreUpdate
    protected void onUpdate() { updatedAt = OffsetDateTime.now(); }
}
