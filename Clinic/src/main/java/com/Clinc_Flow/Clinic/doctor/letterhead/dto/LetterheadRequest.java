package com.Clinc_Flow.Clinic.doctor.letterhead.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LetterheadRequest {
    private String clinicName;
    private String clinicAddress;
    private String clinicPhone;
    private String clinicEmail;
    private String gstNumber;
    private String registrationNumber;
    private Boolean useSystemGenerated;
    private String templateStyle;
}
