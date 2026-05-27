package com.Clinc_Flow.Clinic.user.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuthResponse {
    private String token;
    private Long id;
    private String name;
    private String username;
    private String role;
    private Long doctorId;
    private Long patientId;
}
