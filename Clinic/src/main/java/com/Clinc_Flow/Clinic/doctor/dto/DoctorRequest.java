package com.Clinc_Flow.Clinic.doctor.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 150)
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 100)
    private String email;

    @Size(max = 20)
    private String phone;

    @Size(max = 100)
    private String specialization;

    private String qualifications;

    private String bio;

    @DecimalMin(value = "0.0", inclusive = false, message = "Consultation fee must be positive")
    @Digits(integer = 8, fraction = 2)
    private BigDecimal consultationFee;

    private Boolean isActive;

    private Boolean googleCalendarEnabled;

    private List<AchievementDto> achievements;
}
