package com.Clinc_Flow.Clinic.income;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface IncomeRecordRepository extends JpaRepository<IncomeRecord, Long> {

    List<IncomeRecord> findByIncomeTypeOrderByCreatedAtDesc(String incomeType);

    List<IncomeRecord> findByCreatedAtBetweenOrderByCreatedAtDesc(OffsetDateTime start, OffsetDateTime end);

    @Query("SELECT COALESCE(SUM(i.amount), 0) FROM IncomeRecord i WHERE i.createdAt >= :since")
    BigDecimal totalIncomeSince(OffsetDateTime since);

    @Query("SELECT COALESCE(SUM(i.amount), 0) FROM IncomeRecord i WHERE i.createdAt >= :start AND i.createdAt < :end")
    BigDecimal totalIncomeBetween(OffsetDateTime start, OffsetDateTime end);

    @Query("SELECT COALESCE(SUM(i.amount), 0) FROM IncomeRecord i WHERE i.incomeType = :type AND i.createdAt >= :since")
    BigDecimal totalIncomeByTypeSince(String type, OffsetDateTime since);

    @Query("SELECT i.incomeType, COALESCE(SUM(i.amount), 0) FROM IncomeRecord i GROUP BY i.incomeType")
    List<Object[]> sumByIncomeType();
}
