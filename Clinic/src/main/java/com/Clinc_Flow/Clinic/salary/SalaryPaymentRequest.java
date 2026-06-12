package com.Clinc_Flow.Clinic.salary;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class SalaryPaymentRequest {

    @NotNull(message = "Staff ID is required")
    private Long staffId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    private String paymentMethod;

    private String notes;

    private String transactionRef;
}
