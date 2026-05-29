package com.Clinc_Flow.Clinic.inventory.dto;

import com.Clinc_Flow.Clinic.inventory.StockTransaction;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockTransactionResponse {

    private Long id;
    private Long itemId;
    private String itemName;
    private BigDecimal quantityChanged;
    private String transactionType;
    private BigDecimal previousQuantity;
    private BigDecimal newQuantity;
    private Long performedById;
    private String notes;
    private String referenceType;
    private Long referenceId;
    private OffsetDateTime createdAt;

    public static StockTransactionResponse fromEntity(StockTransaction txn) {
        return StockTransactionResponse.builder()
                .id(txn.getId())
                .itemId(txn.getItem().getId())
                .itemName(txn.getItem().getItemName())
                .quantityChanged(txn.getQuantityChanged())
                .transactionType(txn.getTransactionType())
                .previousQuantity(txn.getPreviousQuantity())
                .newQuantity(txn.getNewQuantity())
                .performedById(txn.getPerformedById())
                .notes(txn.getNotes())
                .referenceType(txn.getReferenceType())
                .referenceId(txn.getReferenceId())
                .createdAt(txn.getCreatedAt())
                .build();
    }
}
