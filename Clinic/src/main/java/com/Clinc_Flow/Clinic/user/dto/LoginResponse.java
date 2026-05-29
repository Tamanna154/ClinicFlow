package com.Clinc_Flow.Clinic.user.dto;

import com.Clinc_Flow.Clinic.user.User;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LoginResponse {
    private Long id;
    private String name;
    private String username;
    private String role;
    private Long doctorId;
    private Long patientId;

    public static LoginResponse fromEntity(User user) {
        return LoginResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .username(user.getUsername())
                .role(user.getRole().name())
                .doctorId(user.getDoctorId())
                .patientId(user.getPatientId())
                .build();
    }
}
