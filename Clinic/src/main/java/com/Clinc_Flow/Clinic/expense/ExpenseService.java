package com.Clinc_Flow.Clinic.expense;

import com.Clinc_Flow.Clinic.expense.dto.*;
import com.Clinc_Flow.Clinic.income.IncomeRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final IncomeRecordRepository incomeRecordRepository;

    @Transactional
    public ExpenseResponse createExpense(ExpenseRequest request, Long userId) {
        Expense expense = Expense.builder()
                .expenseCategory(request.getExpenseCategory())
                .amount(request.getAmount())
                .description(request.getDescription())
                .expenseDate(request.getExpenseDate() != null ? request.getExpenseDate() : OffsetDateTime.now())
                .createdBy(userId)
                .build();
        return ExpenseResponse.fromEntity(expenseRepository.save(expense));
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> getAllExpenses() {
        return expenseRepository.findAllByOrderByExpenseDateDesc().stream()
                .map(ExpenseResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProfitResponse getProfitReport() {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime todayStart = now.toLocalDate().atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();
        OffsetDateTime monthStart = now.withDayOfMonth(1).toLocalDate().atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();
        OffsetDateTime yearStart = now.withDayOfYear(1).toLocalDate().atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();
        OffsetDateTime nextMonth = monthStart.plusMonths(1);

        OffsetDateTime dawnOfTime = OffsetDateTime.now().minusYears(100);
        BigDecimal totalIncome = incomeRecordRepository.totalIncomeSince(dawnOfTime);
        BigDecimal totalExpense = expenseRepository.totalExpenseSince(dawnOfTime);
        BigDecimal todayIncome = incomeRecordRepository.totalIncomeBetween(todayStart, todayStart.plusDays(1));
        BigDecimal todayExpense = expenseRepository.totalExpenseBetween(todayStart, todayStart.plusDays(1));
        BigDecimal monthlyIncome = incomeRecordRepository.totalIncomeBetween(monthStart, nextMonth);
        BigDecimal monthlyExpense = expenseRepository.totalExpenseBetween(monthStart, nextMonth);
        BigDecimal yearlyIncome = incomeRecordRepository.totalIncomeSince(yearStart);
        BigDecimal yearlyExpense = expenseRepository.totalExpenseSince(yearStart);

        if (totalIncome == null) totalIncome = BigDecimal.ZERO;
        if (totalExpense == null) totalExpense = BigDecimal.ZERO;
        if (todayIncome == null) todayIncome = BigDecimal.ZERO;
        if (todayExpense == null) todayExpense = BigDecimal.ZERO;
        if (monthlyIncome == null) monthlyIncome = BigDecimal.ZERO;
        if (monthlyExpense == null) monthlyExpense = BigDecimal.ZERO;
        if (yearlyIncome == null) yearlyIncome = BigDecimal.ZERO;
        if (yearlyExpense == null) yearlyExpense = BigDecimal.ZERO;

        // Monthly trend for last 12 months
        List<ProfitResponse.MonthlyTrend> trends = new ArrayList<>();
        YearMonth startMonth = YearMonth.from(now).minusMonths(11);
        for (int i = 0; i < 12; i++) {
            YearMonth ym = startMonth.plusMonths(i);
            OffsetDateTime monthFrom = ym.atDay(1).atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();
            OffsetDateTime monthTo = ym.plusMonths(1).atDay(1).atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();

            BigDecimal inc = incomeRecordRepository.totalIncomeBetween(monthFrom, monthTo);
            BigDecimal exp = expenseRepository.totalExpenseBetween(monthFrom, monthTo);
            trends.add(ProfitResponse.MonthlyTrend.builder()
                    .year(ym.getYear())
                    .month(ym.getMonthValue())
                    .income(inc != null ? inc : BigDecimal.ZERO)
                    .expense(exp != null ? exp : BigDecimal.ZERO)
                    .profit((inc != null ? inc : BigDecimal.ZERO).subtract(exp != null ? exp : BigDecimal.ZERO))
                    .build());
        }

        // Expense breakdown by category
        List<Object[]> catSums = expenseRepository.sumByCategory();
        Map<String, BigDecimal> expenseBreakdown = new LinkedHashMap<>();
        for (Object[] row : catSums) {
            expenseBreakdown.put((String) row[0], (BigDecimal) row[1]);
        }

        return ProfitResponse.builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netProfit(totalIncome.subtract(totalExpense))
                .todayProfit(todayIncome.subtract(todayExpense))
                .monthlyProfit(monthlyIncome.subtract(monthlyExpense))
                .yearlyProfit(yearlyIncome.subtract(yearlyExpense))
                .monthlyTrend(trends)
                .expenseBreakdown(expenseBreakdown)
                .build();
     }

     @Transactional
     public ExpenseResponse uploadBillImage(Long id, org.springframework.web.multipart.MultipartFile file, String baseUrl) {
         Expense expense = expenseRepository.findById(id)
                 .orElseThrow(() -> new com.Clinc_Flow.Clinic.exception.ResourceNotFoundException("Expense", id));
         try {
             String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
             java.nio.file.Path uploadPath = java.nio.file.Paths.get("uploads/expenses");
             if (!java.nio.file.Files.exists(uploadPath)) {
                 java.nio.file.Files.createDirectories(uploadPath);
             }
             java.nio.file.Path filePath = uploadPath.resolve(filename);
             java.nio.file.Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

             expense.setBillImagePath("expenses/" + filename);
             expense = expenseRepository.save(expense);
             return ExpenseResponse.fromEntity(expense, baseUrl);
         } catch (java.io.IOException e) {
             throw new RuntimeException("Failed to upload bill image", e);
         }
     }
}
