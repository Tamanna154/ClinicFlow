package com.Clinc_Flow.Clinic.consultation.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationBillRequest {

    private BigDecimal consultationFee;
    private BigDecimal additionalCharges;
    private String additionalChargesDescription;
    private BigDecimal discount;
    private BigDecimal tax;
    private String paymentStatus;
    private String paymentMethod;
}
