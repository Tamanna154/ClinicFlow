package com.Clinc_Flow.Clinic.patient;

import com.Clinc_Flow.Clinic.patient.dto.PatientStatsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PatientStatsService {

    private final PatientRepository patientRepository;
    private final PatientVisitRepository patientVisitRepository;

    @Transactional(readOnly = true)
    public PatientStatsResponse getOverview() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        OffsetDateTime startOfDay = now.toLocalDate().atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();
        OffsetDateTime startOfMonth = now.withDayOfMonth(1).toLocalDate().atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();
        OffsetDateTime thirtyDaysAgo = now.minusDays(30);
        OffsetDateTime twelveMonthsAgo = now.minusMonths(12);

        long totalPatients = patientRepository.count();
        long newPatientsToday = patientRepository.countByCreatedAtBetween(startOfDay, now);
        long newPatientsThisMonth = patientRepository.countByCreatedAtAfter(startOfMonth);

        List<Patient> allPatients = patientRepository.findAll();
        long returningPatients = allPatients.stream()
                .filter(p -> patientVisitRepository.findByPatientIdOrderByVisitDateDesc(p.getId()).size() > 1)
                .count();

        List<PatientStatsResponse.DailyCount> dailyCounts = new ArrayList<>();
        List<Object[]> dailyRows = patientRepository.countByDateGroupedNative(thirtyDaysAgo);
        for (Object[] row : dailyRows) {
            String date = row[0] != null ? row[0].toString() : "";
            long count = ((Number) row[1]).longValue();
            dailyCounts.add(PatientStatsResponse.DailyCount.builder().date(date).count(count).build());
        }

        List<PatientStatsResponse.MonthlyGrowth> monthlyCounts = new ArrayList<>();
        List<Object[]> monthlyRows = patientRepository.countByMonthGroupedNative(twelveMonthsAgo);
        for (Object[] row : monthlyRows) {
            String month = row[0] != null ? row[0].toString() : "";
            long count = ((Number) row[1]).longValue();
            monthlyCounts.add(PatientStatsResponse.MonthlyGrowth.builder().month(month).count(count).build());
        }

        return PatientStatsResponse.builder()
                .totalPatients(totalPatients)
                .newPatientsToday(newPatientsToday)
                .newPatientsThisMonth(newPatientsThisMonth)
                .returningPatients(returningPatients)
                .dailyPatientCount(dailyCounts)
                .monthlyPatientGrowth(monthlyCounts)
                .build();
    }
}
