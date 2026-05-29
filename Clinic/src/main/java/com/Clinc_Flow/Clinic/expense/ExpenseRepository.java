package com.Clinc_Flow.Clinic.expense;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findAllByOrderByExpenseDateDesc();

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.createdAt >= :since")
    BigDecimal totalExpenseSince(OffsetDateTime since);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.createdAt >= :start AND e.createdAt < :end")
    BigDecimal totalExpenseBetween(OffsetDateTime start, OffsetDateTime end);

    @Query("SELECT e.expenseCategory, COALESCE(SUM(e.amount), 0) FROM Expense e GROUP BY e.expenseCategory")
    List<Object[]> sumByCategory();

    @Query(value = "SELECT EXTRACT(YEAR FROM e.created_at) as yr, EXTRACT(MONTH FROM e.created_at) as mon, COALESCE(SUM(e.amount), 0) as total FROM expenses e WHERE e.created_at >= :since GROUP BY yr, mon ORDER BY yr, mon", nativeQuery = true)
    List<Object[]> monthlyExpenseSince(OffsetDateTime since);
}
