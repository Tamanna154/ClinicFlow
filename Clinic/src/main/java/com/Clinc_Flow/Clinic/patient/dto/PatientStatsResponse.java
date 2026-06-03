package com.Clinc_Flow.Clinic.patient.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientStatsResponse {
    private long totalPatients;
    private long newPatientsToday;
    private long newPatientsThisMonth;
    private long returningPatients;
    private List<DailyCount> dailyPatientCount;
    private List<MonthlyGrowth> monthlyPatientGrowth;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DailyCount {
        private String date;
        private long count;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthlyGrowth {
        private String month;
        private long count;
    }
}
