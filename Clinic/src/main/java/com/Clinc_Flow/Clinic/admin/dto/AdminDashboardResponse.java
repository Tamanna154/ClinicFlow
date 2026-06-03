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
}
