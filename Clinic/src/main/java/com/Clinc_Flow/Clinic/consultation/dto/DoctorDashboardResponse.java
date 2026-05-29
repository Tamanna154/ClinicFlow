package com.Clinc_Flow.Clinic.consultation.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorDashboardResponse {

    private long totalAppointmentsToday;
    private long completedConsultations;
    private long pendingConsultations;
    private long upcomingAppointments;

    private BigDecimal todayConsultationRevenue;
    private BigDecimal todayMedicineRevenue;
    private BigDecimal todayTotalRevenue;

    private List<FollowUpItem> followUps;
    private List<PendingPaymentItem> pendingPayments;
    private List<TodayAppointmentItem> todayAppointments;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FollowUpItem {
        private Long patientId;
        private String patientName;
        private String patientPhone;
        private LocalDate followUpDate;
        private String lastDiagnosis;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PendingPaymentItem {
        private Long consultationId;
        private Long patientId;
        private String patientName;
        private BigDecimal amount;
        private LocalDate date;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TodayAppointmentItem {
        private Long id;
        private Long patientId;
        private String patientName;
        private String startTime;
        private String endTime;
        private String status;
        private Boolean isOnline;
        private String consultationStatus;
    }
}
