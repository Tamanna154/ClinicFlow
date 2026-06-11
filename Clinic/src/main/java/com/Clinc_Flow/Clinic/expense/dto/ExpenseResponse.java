package com.Clinc_Flow.Clinic.expense.dto;

import com.Clinc_Flow.Clinic.expense.Expense;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseResponse {

    private Long id;
    private String expenseCategory;
    private BigDecimal amount;
    private String description;
    private OffsetDateTime expenseDate;
    private Long createdBy;
    private OffsetDateTime createdAt;
    private String billImageUrl;

    public static ExpenseResponse fromEntity(Expense expense, String baseUrl) {
        return ExpenseResponse.builder()
                .id(expense.getId())
                .expenseCategory(expense.getExpenseCategory())
                .amount(expense.getAmount())
                .description(expense.getDescription())
                .expenseDate(expense.getExpenseDate())
                .createdBy(expense.getCreatedBy())
                .createdAt(expense.getCreatedAt())
                .billImageUrl(expense.getBillImagePath() != null && baseUrl != null ? baseUrl + "/uploads/" + expense.getBillImagePath() : null)
                .build();
    }

    public static ExpenseResponse fromEntity(Expense expense) {
        return fromEntity(expense, null);
    }
}
