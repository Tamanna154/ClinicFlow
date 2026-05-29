package com.Clinc_Flow.Clinic.billing.dto;

import com.Clinc_Flow.Clinic.billing.Bill;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillResponse {

    private Long id;
    private String billNumber;
    private Long patientId;
    private String patientName;
    private String patientPhone;
    private Long createdBy;
    private BigDecimal subtotal;
    private BigDecimal discount;
    private BigDecimal tax;
    private BigDecimal totalAmount;
    private String paymentStatus;
    private String paymentMethod;
    private OffsetDateTime billDate;
    private OffsetDateTime createdAt;
    private List<BillItemResponse> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BillItemResponse {
        private Long id;
        private Long inventoryItemId;
        private String itemName;
        private BigDecimal quantity;
        private BigDecimal sellingPrice;
        private BigDecimal lineTotal;
    }

    public static BillResponse fromEntity(Bill bill) {
        List<BillItemResponse> itemResponses = bill.getBillItems().stream()
                .map(item -> BillItemResponse.builder()
                        .id(item.getId())
                        .inventoryItemId(item.getInventoryItemId())
                        .itemName(item.getItemName())
                        .quantity(item.getQuantity())
                        .sellingPrice(item.getSellingPrice())
                        .lineTotal(item.getLineTotal())
                        .build())
                .toList();

        return BillResponse.builder()
                .id(bill.getId())
                .billNumber(bill.getBillNumber())
                .patientId(bill.getPatientId())
                .createdBy(bill.getCreatedBy())
                .subtotal(bill.getSubtotal())
                .discount(bill.getDiscount())
                .tax(bill.getTax())
                .totalAmount(bill.getTotalAmount())
                .paymentStatus(bill.getPaymentStatus())
                .paymentMethod(bill.getPaymentMethod())
                .billDate(bill.getBillDate())
                .createdAt(bill.getCreatedAt())
                .items(itemResponses)
                .build();
    }
}
