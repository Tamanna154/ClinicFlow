package com.Clinc_Flow.Clinic.doctor.dto;

import com.Clinc_Flow.Clinic.doctor.Doctor;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private String specialization;
    private String qualifications;
    private String bio;
    private BigDecimal consultationFee;
    private Boolean isActive;
    private Boolean googleCalendarEnabled;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static DoctorResponse fromEntity(Doctor doctor) {
        return DoctorResponse.builder()
                .id(doctor.getId())
                .name(doctor.getName())
                .email(doctor.getEmail())
                .phone(doctor.getPhone())
                .specialization(doctor.getSpecialization())
                .qualifications(doctor.getQualifications())
                .bio(doctor.getBio())
                .consultationFee(doctor.getConsultationFee())
                .isActive(doctor.getIsActive())
                .googleCalendarEnabled(doctor.getGoogleCalendarEnabled())
                .createdAt(doctor.getCreatedAt())
                .updatedAt(doctor.getUpdatedAt())
                .build();
    }
}
