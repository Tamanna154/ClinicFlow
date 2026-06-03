package com.Clinc_Flow.Clinic.user.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ForgotPasswordRequest {
    private String email;
    private String phone;
}
