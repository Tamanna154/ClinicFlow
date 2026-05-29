package com.Clinc_Flow.Clinic.billing.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillingSummaryResponse {

    private long totalBills;
    private long paidBills;
    private long pendingBills;
    private BigDecimal totalRevenue;
}
