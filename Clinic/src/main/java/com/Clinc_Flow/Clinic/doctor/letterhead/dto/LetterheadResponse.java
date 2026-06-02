package com.Clinc_Flow.Clinic.doctor.letterhead.dto;

import com.Clinc_Flow.Clinic.doctor.letterhead.Letterhead;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LetterheadResponse {
    private Long id;
    private Long doctorId;
    private String clinicName;
    private String clinicAddress;
    private String clinicPhone;
    private String clinicEmail;
    private String clinicLogoUrl;
    private String letterheadDesignUrl;
    private String signatureUrl;
    private String gstNumber;
    private String registrationNumber;
    private Boolean useSystemGenerated;
    private Boolean isActive;

    public static LetterheadResponse fromEntity(Letterhead lh, String baseUrl) {
        return LetterheadResponse.builder()
                .id(lh.getId())
                .doctorId(lh.getDoctorId())
                .clinicName(lh.getClinicName())
                .clinicAddress(lh.getClinicAddress())
                .clinicPhone(lh.getClinicPhone())
                .clinicEmail(lh.getClinicEmail())
                .clinicLogoUrl(lh.getClinicLogoPath() != null ? baseUrl + "/uploads/" + lh.getClinicLogoPath() : null)
                .letterheadDesignUrl(lh.getLetterheadDesignPath() != null ? baseUrl + "/uploads/" + lh.getLetterheadDesignPath() : null)
                .signatureUrl(lh.getSignaturePath() != null ? baseUrl + "/uploads/" + lh.getSignaturePath() : null)
                .gstNumber(lh.getGstNumber())
                .registrationNumber(lh.getRegistrationNumber())
                .useSystemGenerated(lh.getUseSystemGenerated())
                .isActive(lh.getIsActive())
                .build();
    }
}
