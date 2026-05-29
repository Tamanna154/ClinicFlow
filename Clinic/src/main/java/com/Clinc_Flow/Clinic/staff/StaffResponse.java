package com.Clinc_Flow.Clinic.staff;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StaffResponse {
    private Long id;
    private Long staffUserId;
    private String staffName;
    private String staffUsername;
    private List<String> permissions;
    private OffsetDateTime createdAt;

    private String phone;
    private Integer age;
    private String email;
    private String address;
    private String roleTitle;
    private String aadharNumber;
    private String panNumber;
    private String bankAccountNo;
    private String bankName;
    private String ifscCode;
    private String emergencyContact;
    private String notes;
    private Boolean isActive;
}
