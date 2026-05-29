package com.Clinc_Flow.Clinic.billing.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    private BigDecimal discount;

    private BigDecimal tax;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod;

    @NotBlank(message = "Payment status is required")
    private String paymentStatus;

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<BillItemRequest> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BillItemRequest {

        @NotNull(message = "Inventory item ID is required")
        private Long inventoryItemId;

        @NotNull(message = "Quantity is required")
        @DecimalMin(value = "0.01", message = "Quantity must be positive")
        private BigDecimal quantity;
    }
}
