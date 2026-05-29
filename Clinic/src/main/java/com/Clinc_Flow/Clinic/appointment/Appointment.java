package com.Clinc_Flow.Clinic.appointment;

import com.Clinc_Flow.Clinic.doctor.Doctor;
import com.Clinc_Flow.Clinic.patient.Patient;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "SCHEDULED";

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "google_event_id", length = 255)
    private String googleEventId;

    @Column(name = "appointment_type", length = 20)
    private String appointmentType;

    @Column(name = "is_online", nullable = false)
    private Boolean isOnline = false;

    @Column(name = "meeting_link", length = 500)
    private String meetingLink;

    @Column(name = "consultation_notes", columnDefinition = "TEXT")
    private String consultationNotes;

    @Column(name = "appointment_fee", precision = 12, scale = 2)
    private BigDecimal appointmentFee;

    @Column(name = "fee_payment_method", length = 20)
    private String feePaymentMethod;

    @Column(name = "fee_payment_status", length = 20)
    private String feePaymentStatus;

    @Column(name = "fee_payment_date")
    private OffsetDateTime feePaymentDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
        if (status == null) status = "SCHEDULED";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
