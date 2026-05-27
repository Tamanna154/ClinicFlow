package com.Clinc_Flow.Clinic.appointment.dto;

import com.Clinc_Flow.Clinic.appointment.Appointment;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentResponse {

    private Long id;
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialization;
    private Long patientId;
    private String patientName;
    private String patientPhone;
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String status;
    private String reason;
    private String notes;
    private String googleEventId;
    private Boolean isOnline;
    private String meetingLink;
    private String consultationNotes;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static AppointmentResponse fromEntity(Appointment appointment) {
        return AppointmentResponse.builder()
                .id(appointment.getId())
                .doctorId(appointment.getDoctor().getId())
                .doctorName(appointment.getDoctor().getName())
                .doctorSpecialization(appointment.getDoctor().getSpecialization())
                .patientId(appointment.getPatient().getId())
                .patientName(appointment.getPatient().getName())
                .patientPhone(appointment.getPatient().getPhone())
                .appointmentDate(appointment.getAppointmentDate())
                .startTime(appointment.getStartTime())
                .endTime(appointment.getEndTime())
                .status(appointment.getStatus())
                .reason(appointment.getReason())
                .notes(appointment.getNotes())
                .googleEventId(appointment.getGoogleEventId())
                .isOnline(appointment.getIsOnline())
                .meetingLink(appointment.getMeetingLink())
                .consultationNotes(appointment.getConsultationNotes())
                .createdAt(appointment.getCreatedAt())
                .updatedAt(appointment.getUpdatedAt())
                .build();
    }
}
