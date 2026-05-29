package com.Clinc_Flow.Clinic.inventory.dto;

import com.Clinc_Flow.Clinic.inventory.InventoryItem;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryResponse {

    private Long id;
    private String itemName;
    private String stockType;
    private String category;
    private BigDecimal quantity;
    private BigDecimal minimumThreshold;
    private String unitType;
    private BigDecimal purchasePrice;
    private BigDecimal sellingPrice;
    private String supplierName;
    private String batchNumber;
    private LocalDate expiryDate;
    private String description;
    private Boolean archived;
    private Long createdById;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @Builder.Default
    private Boolean isLowStock = false;

    @Builder.Default
    private Boolean isExpired = false;

    @Builder.Default
    private Boolean isNearExpiry = false;

    public static InventoryResponse fromEntity(InventoryItem item) {
        boolean expired = item.getExpiryDate() != null && item.getExpiryDate().isBefore(java.time.LocalDate.now());
        boolean nearExpiry = !expired && item.getExpiryDate() != null
                && !item.getExpiryDate().isAfter(java.time.LocalDate.now().plusDays(30));
        boolean lowStock = item.getQuantity().compareTo(item.getMinimumThreshold()) <= 0;

        return InventoryResponse.builder()
                .id(item.getId())
                .itemName(item.getItemName())
                .stockType(item.getStockType())
                .category(item.getCategory())
                .quantity(item.getQuantity())
                .minimumThreshold(item.getMinimumThreshold())
                .unitType(item.getUnitType())
                .purchasePrice(item.getPurchasePrice())
                .sellingPrice(item.getSellingPrice())
                .supplierName(item.getSupplierName())
                .batchNumber(item.getBatchNumber())
                .expiryDate(item.getExpiryDate())
                .description(item.getDescription())
                .archived(item.getArchived())
                .createdById(item.getCreatedById())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .isLowStock(lowStock)
                .isExpired(expired)
                .isNearExpiry(nearExpiry)
                .build();
    }
}
