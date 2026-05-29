package com.Clinc_Flow.Clinic.user.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class RegisterRequest {
    private String name;
    private String username;
    private String password;
    private String phone;
    private String email;
}
