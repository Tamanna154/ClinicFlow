package com.Clinc_Flow.Clinic.inventory.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockAdjustRequest {

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.01", message = "Quantity must be positive")
    private BigDecimal quantity;

    @NotBlank(message = "Transaction type is required")
    private String transactionType;

    private String notes;
    private String referenceType;
    private Long referenceId;
}
