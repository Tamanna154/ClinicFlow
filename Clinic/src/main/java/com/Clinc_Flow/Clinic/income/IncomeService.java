package com.Clinc_Flow.Clinic.income;

import com.Clinc_Flow.Clinic.income.dto.IncomeResponse;
import com.Clinc_Flow.Clinic.income.dto.IncomeSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class IncomeService {

    private final IncomeRecordRepository incomeRecordRepository;

    @Transactional(readOnly = true)
    public List<IncomeResponse> getAllIncome() {
        return incomeRecordRepository.findAll().stream()
                .map(IncomeResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<IncomeResponse> getIncomeByType(String incomeType) {
        return incomeRecordRepository.findByIncomeTypeOrderByCreatedAtDesc(incomeType).stream()
                .map(IncomeResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public IncomeSummaryResponse getSummary() {
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate yearStart = today.withDayOfYear(1);

        OffsetDateTime todayStart = today.atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();
        OffsetDateTime todayEnd = today.plusDays(1).atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();
        OffsetDateTime monthStartDT = monthStart.atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();
        OffsetDateTime yearStartDT = yearStart.atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();
        OffsetDateTime nextMonth = monthStart.plusMonths(1).atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();

        BigDecimal todayIncome = incomeRecordRepository.totalIncomeBetween(todayStart, todayEnd);
        BigDecimal monthlyIncome = incomeRecordRepository.totalIncomeBetween(monthStartDT, nextMonth);
        BigDecimal yearlyIncome = incomeRecordRepository.totalIncomeSince(yearStartDT);

        OffsetDateTime dawnOfTime = OffsetDateTime.now().minusYears(100);
        BigDecimal appointmentRevenue = incomeRecordRepository.totalIncomeByTypeSince("APPOINTMENT", dawnOfTime);
        BigDecimal medicineRevenue = incomeRecordRepository.totalIncomeByTypeSince("MEDICINE_SALE", dawnOfTime);

        if (todayIncome == null) todayIncome = BigDecimal.ZERO;
        if (monthlyIncome == null) monthlyIncome = BigDecimal.ZERO;
        if (yearlyIncome == null) yearlyIncome = BigDecimal.ZERO;
        if (appointmentRevenue == null) appointmentRevenue = BigDecimal.ZERO;
        if (medicineRevenue == null) medicineRevenue = BigDecimal.ZERO;

        List<Object[]> typeSums = incomeRecordRepository.sumByIncomeType();
        Map<String, BigDecimal> breakdown = new LinkedHashMap<>();
        for (Object[] row : typeSums) {
            String type = (String) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            if (amount == null) amount = BigDecimal.ZERO;
            breakdown.put(type, amount);
        }

        return IncomeSummaryResponse.builder()
                .todayIncome(todayIncome)
                .monthlyIncome(monthlyIncome)
                .yearlyIncome(yearlyIncome)
                .appointmentRevenue(appointmentRevenue)
                .medicineRevenue(medicineRevenue)
                .breakdown(breakdown)
                .build();
    }
}
