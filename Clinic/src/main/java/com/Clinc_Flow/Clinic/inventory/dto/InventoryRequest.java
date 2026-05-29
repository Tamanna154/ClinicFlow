package com.Clinc_Flow.Clinic.inventory.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryRequest {

    @NotBlank(message = "Item name is required")
    @Size(max = 200)
    private String itemName;

    @NotBlank(message = "Stock type is required")
    @Pattern(regexp = "INTERNAL|EXTERNAL", message = "Stock type must be INTERNAL or EXTERNAL")
    private String stockType;

    @Size(max = 100)
    private String category;

    private String unitType;

    @DecimalMin(value = "0.00", message = "Purchase price must be non-negative")
    private BigDecimal purchasePrice;

    @DecimalMin(value = "0.00", message = "Selling price must be non-negative")
    private BigDecimal sellingPrice;

    @Size(max = 200)
    private String supplierName;

    @Size(max = 100)
    private String batchNumber;

    private LocalDate expiryDate;

    @Size(max = 2000)
    private String description;

    @DecimalMin(value = "0", message = "Minimum threshold must be non-negative")
    private BigDecimal minimumThreshold;
}
