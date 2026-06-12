package com.Clinc_Flow.Clinic.salary;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SalaryPaymentResponse {
    private Long id;
    private Long staffId;
    private String staffName;
    private String staffRole;
    private BigDecimal amount;
    private LocalDate paymentDate;
    private String paymentMethod;
    private String status;
    private String notes;
    private String transactionRef;
    private BigDecimal fixedSalary;
    private BigDecimal totalPaid;
    private BigDecimal pendingSalary;
}
