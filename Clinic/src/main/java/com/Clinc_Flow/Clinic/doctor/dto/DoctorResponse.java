package com.Clinc_Flow.Clinic.doctor.dto;

import com.Clinc_Flow.Clinic.doctor.Doctor;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

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
    private String address;
    private String specialization;
    private String qualifications;
    private String bio;
    private BigDecimal consultationFee;
    private Boolean isActive;
    private Boolean googleCalendarEnabled;
    private List<AchievementDto> achievements;
    private Long clinicId;
    private String clinicName;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    
    private String tempUsername;
    private String tempPassword;

    private Integer slotDuration;

    private static List<AchievementDto> mapAchievements(String json) {
        if (json == null || json.trim().isEmpty()) return List.of();
        try {
            com.fasterxml.jackson.core.type.TypeReference<List<AchievementDto>> typeRef = new com.fasterxml.jackson.core.type.TypeReference<>() {};
            return new com.fasterxml.jackson.databind.ObjectMapper().readValue(json, typeRef);
        } catch (Exception e) {
            return List.of();
        }
    }

    public static DoctorResponse fromEntity(Doctor doctor) {
        return DoctorResponse.builder()
                .id(doctor.getId())
                .name(doctor.getName())
                .email(doctor.getEmail())
                .phone(doctor.getPhone())
                .address(doctor.getAddress())
                .specialization(doctor.getSpecialization())
                .qualifications(doctor.getQualifications())
                .bio(doctor.getBio())
                .consultationFee(doctor.getConsultationFee())
                .isActive(doctor.getIsActive())
                .googleCalendarEnabled(doctor.getGoogleCalendarEnabled())
                .achievements(mapAchievements(doctor.getAchievements()))
                .clinicId(doctor.getClinicId())
                .createdAt(doctor.getCreatedAt())
                .updatedAt(doctor.getUpdatedAt())
                .build();
    }
}
