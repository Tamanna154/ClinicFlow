package com.Clinc_Flow.Clinic.clinic.dto;

import com.Clinc_Flow.Clinic.clinic.Clinic;
import lombok.*;
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
                .createdAt(clinic.getCreatedAt())
                .updatedAt(clinic.getUpdatedAt())
                .build();
    }
}
