package com.Clinc_Flow.Clinic.consultation.dto;

import com.Clinc_Flow.Clinic.consultation.Consultation;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationResponse {

    private Long id;
    private Long appointmentId;
    private Long patientId;
    private String patientName;
    private Long doctorId;
    private String doctorName;
    private String symptoms;
    private String diagnosis;
    private String doctorNotes;
    private String bloodPressure;
    private String bloodSugar;
    private Integer pulseRate;
    private BigDecimal weight;
    private BigDecimal height;
    private BigDecimal temperature;
    private BigDecimal oxygenLevel;
    private LocalDate followUpDate;
    private String followUpNotes;
    private String status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    private AppointmentInfo appointment;
    private ConsultationBillInfo bill;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AppointmentInfo {
        private Long id;
        private LocalDate appointmentDate;
        private String startTime;
        private String endTime;
        private String status;
        private Boolean isOnline;
        private String meetingLink;
        private BigDecimal appointmentFee;
        private String feePaymentStatus;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConsultationBillInfo {
        private Long id;
        private BigDecimal subtotal;
        private BigDecimal discount;
        private BigDecimal tax;
        private BigDecimal totalAmount;
        private String paymentStatus;
        private String paymentMethod;
    }

    public static ConsultationResponse fromEntity(Consultation consultation) {
        ConsultationResponse resp = ConsultationResponse.builder()
                .id(consultation.getId())
                .appointmentId(consultation.getAppointment().getId())
                .patientId(consultation.getPatientId())
                .doctorId(consultation.getDoctorId())
                .symptoms(consultation.getSymptoms())
                .diagnosis(consultation.getDiagnosis())
                .doctorNotes(consultation.getDoctorNotes())
                .bloodPressure(consultation.getBloodPressure())
                .bloodSugar(consultation.getBloodSugar())
                .pulseRate(consultation.getPulseRate())
                .weight(consultation.getWeight())
                .height(consultation.getHeight())
                .temperature(consultation.getTemperature())
                .oxygenLevel(consultation.getOxygenLevel())
                .followUpDate(consultation.getFollowUpDate())
                .followUpNotes(consultation.getFollowUpNotes())
                .status(consultation.getStatus())
                .createdAt(consultation.getCreatedAt())
                .updatedAt(consultation.getUpdatedAt())
                .build();

        var appt = consultation.getAppointment();
        if (appt != null) {
            resp.setAppointment(AppointmentInfo.builder()
                    .id(appt.getId())
                    .appointmentDate(appt.getAppointmentDate())
                    .startTime(appt.getStartTime() != null ? appt.getStartTime().toString() : null)
                    .endTime(appt.getEndTime() != null ? appt.getEndTime().toString() : null)
                    .status(appt.getStatus())
                    .isOnline(appt.getIsOnline())
                    .meetingLink(appt.getMeetingLink())
                    .appointmentFee(appt.getAppointmentFee())
                    .feePaymentStatus(appt.getFeePaymentStatus())
                    .build());
            if (appt.getDoctor() != null) {
                resp.setDoctorName(appt.getDoctor().getName());
            }
        }

        return resp;
    }
}
