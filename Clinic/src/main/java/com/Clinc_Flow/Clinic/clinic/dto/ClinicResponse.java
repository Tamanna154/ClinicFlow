package com.Clinc_Flow.Clinic.clinic.dto;

import com.Clinc_Flow.Clinic.clinic.Clinic;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClinicResponse {

    private Long id;
    private String name;
    private String address;
    private String phone;
    private String email;
    private String logoPath;
    private String city;
    private String state;
    private String country;
    private String pincode;
    private String gstNumber;
    private String registrationNumber;
    private String workingHours;
    private BigDecimal consultationFees;
    private String clinicSpecialization;
    private String socialMediaLinks;
    private String timeZone;
    private String currency;
    private Integer appointmentDuration;
    private Boolean smsEnabled;
    private Boolean whatsappEnabled;
    private Boolean emailNotificationsEnabled;
    private Boolean isVerified;
    private Long clinicAdminUserId;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static ClinicResponse fromEntity(Clinic clinic) {
        return ClinicResponse.builder()
                .id(clinic.getId())
                .name(clinic.getName())
                .address(clinic.getAddress())
                .phone(clinic.getPhone())
                .email(clinic.getEmail())
                .logoPath(clinic.getLogoPath())
                .city(clinic.getCity())
                .state(clinic.getState())
                .country(clinic.getCountry())
                .pincode(clinic.getPincode())
                .gstNumber(clinic.getGstNumber())
                .registrationNumber(clinic.getRegistrationNumber())
                .workingHours(clinic.getWorkingHours())
                .consultationFees(clinic.getConsultationFees())
                .clinicSpecialization(clinic.getClinicSpecialization())
                .socialMediaLinks(clinic.getSocialMediaLinks())
                .timeZone(clinic.getTimeZone())
                .currency(clinic.getCurrency())
                .appointmentDuration(clinic.getAppointmentDuration())
                .smsEnabled(clinic.getSmsEnabled())
                .whatsappEnabled(clinic.getWhatsappEnabled())
                .emailNotificationsEnabled(clinic.getEmailNotificationsEnabled())
                .isVerified(clinic.getIsVerified())
                .clinicAdminUserId(clinic.getClinicAdminUserId())
                .createdAt(clinic.getCreatedAt())
                .updatedAt(clinic.getUpdatedAt())
                .build();
    }
}
