package com.Clinc_Flow.Clinic.staff;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
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
    private String tempPassword;

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

    private String dutyTime;
    private BigDecimal fixedSalary;
    private BigDecimal totalPaid;
    private BigDecimal pendingSalary;
    private LocalDate lastPaymentDate;
    private BigDecimal lastPaymentAmount;
    private Long doctorUserId;
}
