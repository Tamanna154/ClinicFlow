package com.Clinc_Flow.Clinic.staff;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateStaffRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 150)
    private String fullName;

    @Size(min = 10, max = 20)
    private String phone;

    @Min(value = 18, message = "Age must be at least 18")
    @Max(value = 100, message = "Age must be at most 100")
    private Integer age;

    @Email(message = "Invalid email format")
    @Size(max = 100)
    private String email;

    private String address;

    @NotBlank(message = "Role title is required")
    private String roleTitle;

    @Size(max = 20)
    private String aadharNumber;

    @Size(max = 20)
    private String panNumber;

    @Size(max = 30)
    private String bankAccountNo;

    @Size(max = 100)
    private String bankName;

    @Size(max = 20)
    private String ifscCode;

    @Size(max = 20)
    private String emergencyContact;

    private String notes;
}
