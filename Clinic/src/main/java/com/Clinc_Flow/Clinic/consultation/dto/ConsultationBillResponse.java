package com.Clinc_Flow.Clinic.consultation.dto;

import com.Clinc_Flow.Clinic.consultation.ConsultationBill;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationBillResponse {

    private Long id;
    private Long consultationId;
    private Long billId;
    private BigDecimal consultationFee;
    private BigDecimal additionalCharges;
    private String additionalChargesDescription;
    private BigDecimal subtotal;
    private BigDecimal discount;
    private BigDecimal tax;
    private BigDecimal totalAmount;
    private String paymentStatus;
    private String paymentMethod;
    private OffsetDateTime paymentDate;
    private OffsetDateTime createdAt;

    public static ConsultationBillResponse fromEntity(ConsultationBill bill) {
        return ConsultationBillResponse.builder()
                .id(bill.getId())
                .consultationId(bill.getConsultationId())
                .billId(bill.getBillId())
                .consultationFee(bill.getConsultationFee())
                .additionalCharges(bill.getAdditionalCharges())
                .additionalChargesDescription(bill.getAdditionalChargesDescription())
                .subtotal(bill.getSubtotal())
                .discount(bill.getDiscount())
                .tax(bill.getTax())
                .totalAmount(bill.getTotalAmount())
                .paymentStatus(bill.getPaymentStatus())
                .paymentMethod(bill.getPaymentMethod())
                .paymentDate(bill.getPaymentDate())
                .createdAt(bill.getCreatedAt())
                .build();
    }
}
