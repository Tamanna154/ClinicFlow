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

    public static ExpenseResponse fromEntity(Expense expense) {
        return ExpenseResponse.builder()
                .id(expense.getId())
                .expenseCategory(expense.getExpenseCategory())
                .amount(expense.getAmount())
                .description(expense.getDescription())
                .expenseDate(expense.getExpenseDate())
                .createdBy(expense.getCreatedBy())
                .createdAt(expense.getCreatedAt())
                .build();
    }
}
