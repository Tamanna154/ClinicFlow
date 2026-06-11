package com.Clinc_Flow.Clinic.admin.dto;

import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponse {
    private int todayAppointments;
    private int completedAppointments;
    private int pendingAppointments;
    private int upcomingAppointments;
    private long totalPatients;
    private long totalDoctors;
    private long totalActiveDoctors;
    private long totalStaff;
    private BigDecimal todayRevenue;
    private BigDecimal monthlyRevenue;
    private BigDecimal totalRevenue;
    private BigDecimal todayExpenses;
    private BigDecimal monthlyExpenses;
    private BigDecimal netProfit;
    private int lowStockItems;
    private int expiringItems;
    private int pendingFollowUps;
    private int todayNewPatients;
    private int monthlyNewPatients;
    private long totalBills;
    private long pendingBills;

    private java.math.BigDecimal incomeDoctors;
    private java.math.BigDecimal incomeLab;
    private java.math.BigDecimal incomeMedicals;
    private java.math.BigDecimal incomePatients;
    private java.math.BigDecimal incomeOther;

    private java.math.BigDecimal expenseRent;
    private java.math.BigDecimal expenseLightBill;
    private java.math.BigDecimal expenseMaintenance;
    private java.math.BigDecimal expenseOther;

    private java.util.List<DoctorStats> doctorStats;
    private java.util.List<StaffStats> staffStats;

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class DoctorStats {
        private String name;
        private String specialty;
        private long appointmentCount;
        private boolean isActive;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class StaffStats {
        private String name;
        private String roleTitle;
        private String dutyTime;
        private java.math.BigDecimal fixedSalary;
    }
}
