package com.Clinc_Flow.Clinic.clinic.dto;

import jakarta.validation.constraints.*;
import lombok.*;

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
}
