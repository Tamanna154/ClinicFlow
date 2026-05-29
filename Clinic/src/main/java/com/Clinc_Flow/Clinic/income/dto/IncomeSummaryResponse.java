package com.Clinc_Flow.Clinic.income.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IncomeSummaryResponse {

    private BigDecimal todayIncome;
    private BigDecimal monthlyIncome;
    private BigDecimal yearlyIncome;
    private BigDecimal appointmentRevenue;
    private BigDecimal medicineRevenue;
    private Map<String, BigDecimal> breakdown;
}
