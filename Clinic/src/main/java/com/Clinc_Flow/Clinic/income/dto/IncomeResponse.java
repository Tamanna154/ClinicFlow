package com.Clinc_Flow.Clinic.income.dto;

import com.Clinc_Flow.Clinic.income.IncomeRecord;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IncomeResponse {

    private Long id;
    private String incomeType;
    private Long referenceId;
    private BigDecimal amount;
    private String paymentMethod;
    private Long receivedBy;
    private String description;
    private OffsetDateTime createdAt;

    public static IncomeResponse fromEntity(IncomeRecord record) {
        return IncomeResponse.builder()
                .id(record.getId())
                .incomeType(record.getIncomeType())
                .referenceId(record.getReferenceId())
                .amount(record.getAmount())
                .paymentMethod(record.getPaymentMethod())
                .receivedBy(record.getReceivedBy())
                .description(record.getDescription())
                .createdAt(record.getCreatedAt())
                .build();
    }
}
