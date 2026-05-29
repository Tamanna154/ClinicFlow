package com.Clinc_Flow.Clinic.expense.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfitResponse {

    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal netProfit;
    private BigDecimal todayProfit;
    private BigDecimal monthlyProfit;
    private BigDecimal yearlyProfit;
    private List<MonthlyTrend> monthlyTrend;
    private Map<String, BigDecimal> expenseBreakdown;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthlyTrend {
        private int year;
        private int month;
        private BigDecimal income;
        private BigDecimal expense;
        private BigDecimal profit;
    }
}
