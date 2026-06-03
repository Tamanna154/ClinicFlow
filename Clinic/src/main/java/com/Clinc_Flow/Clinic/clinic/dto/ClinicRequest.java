package com.Clinc_Flow.Clinic.clinic.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClinicRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 150)
    private String name;

    private String address;

    @Size(max = 20)
    private String phone;

    @Email(message = "Invalid email format")
    @Size(max = 100)
    private String email;

    @Size(max = 500)
    private String logoPath;

    @Size(max = 100)
    private String city;

    @Size(max = 100)
    private String state;

    @Size(max = 100)
    private String country;

    @Size(max = 20)
    private String pincode;

    @Size(max = 50)
    private String gstNumber;

    @Size(max = 100)
    private String registrationNumber;

    private String workingHours;

    private BigDecimal consultationFees;

    @Size(max = 200)
    private String clinicSpecialization;

    private String socialMediaLinks;

    @Size(max = 50)
    private String timeZone;

    @Size(max = 10)
    private String currency;

    private Integer appointmentDuration;

    private Boolean smsEnabled;

    private Boolean whatsappEnabled;

    private Boolean emailNotificationsEnabled;

    private Boolean isVerified;

    private Long clinicAdminUserId;
}
