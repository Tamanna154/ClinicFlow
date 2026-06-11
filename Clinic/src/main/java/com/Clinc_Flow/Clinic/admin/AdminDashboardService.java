package com.Clinc_Flow.Clinic.admin;

import com.Clinc_Flow.Clinic.admin.dto.AdminDashboardResponse;
import com.Clinc_Flow.Clinic.admin.dto.AdminRevenueTrendResponse;
import com.Clinc_Flow.Clinic.appointment.AppointmentRepository;
import com.Clinc_Flow.Clinic.billing.BillRepository;
import com.Clinc_Flow.Clinic.consultation.ConsultationRepository;
import com.Clinc_Flow.Clinic.doctor.DoctorRepository;
import com.Clinc_Flow.Clinic.expense.ExpenseRepository;
import com.Clinc_Flow.Clinic.income.IncomeRecordRepository;
import com.Clinc_Flow.Clinic.inventory.InventoryRepository;
import com.Clinc_Flow.Clinic.patient.PatientRepository;
import com.Clinc_Flow.Clinic.staff.DoctorStaffRepository;
import lombok.RequiredArgsConstructor;
import com.Clinc_Flow.Clinic.user.User;
import com.Clinc_Flow.Clinic.staff.StaffDetails;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final BillRepository billRepository;
    private final IncomeRecordRepository incomeRecordRepository;
    private final ExpenseRepository expenseRepository;
    private final InventoryRepository inventoryRepository;
    private final ConsultationRepository consultationRepository;
    private final DoctorStaffRepository doctorStaffRepository;
    private final com.Clinc_Flow.Clinic.compensation.StaffCompensationRepository staffCompensationRepository;
    private final com.Clinc_Flow.Clinic.staff.StaffDetailsRepository staffDetailsRepository;
    private final com.Clinc_Flow.Clinic.user.UserRepository userRepository;

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboardStats() {
        LocalDate today = LocalDate.now();
        OffsetDateTime todayStart = today.atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();
        OffsetDateTime todayEnd = today.plusDays(1).atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();
        OffsetDateTime monthStart = today.withDayOfMonth(1).atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();
        OffsetDateTime nextMonth = monthStart.plusMonths(1);
        OffsetDateTime dawnOfTime = OffsetDateTime.now().minusYears(100);

        int todayAppts = (int) appointmentRepository.countByAppointmentDate(today);
        int completedToday = (int) appointmentRepository.countByAppointmentDateAndStatus(today, "COMPLETED");
        int pendingToday = (int) appointmentRepository.countByAppointmentDateAndStatusNotIn(today, java.util.List.of("COMPLETED", "CANCELLED"));
        int upcomingAppts = (int) appointmentRepository.countByAppointmentDateAfter(today);

        long totalPatients = patientRepository.countByArchivedFalse();
        long totalDoctors = doctorRepository.count();
        long totalActiveDoctors = doctorRepository.findByIsActiveTrue().size();
        long totalStaff = doctorStaffRepository.count();

        BigDecimal todayRevenue = incomeRecordRepository.totalIncomeBetween(todayStart, todayEnd);
        BigDecimal monthlyRevenue = incomeRecordRepository.totalIncomeBetween(monthStart, nextMonth);
        BigDecimal totalRevenue = incomeRecordRepository.totalIncomeSince(dawnOfTime);

        BigDecimal todayExp = expenseRepository.totalExpenseBetween(todayStart, todayEnd);
        BigDecimal monthlyExp = expenseRepository.totalExpenseBetween(monthStart, nextMonth);

        BigDecimal netProfit = monthlyRevenue.subtract(monthlyExp);

        int lowStock = inventoryRepository.findLowStockItems().size();
        int expiring = inventoryRepository.findNearExpiryItems(today, today.plusDays(30)).size();

        int pendingFU = consultationRepository.countByFollowUpDateGreaterThanEqualAndFollowUpDateIsNotNull(today);

        int todayNewPats = (int) patientRepository.countByCreatedAtBetween(todayStart, todayEnd);
        int monthlyNewPats = (int) patientRepository.countByCreatedAtAfter(monthStart);

        long totalBills = billRepository.count();
        long pendingBills = billRepository.countByPaymentStatusNot("PAID");

        if (todayRevenue == null) todayRevenue = BigDecimal.ZERO;
        if (monthlyRevenue == null) monthlyRevenue = BigDecimal.ZERO;
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;
        if (todayExp == null) todayExp = BigDecimal.ZERO;
        if (monthlyExp == null) monthlyExp = BigDecimal.ZERO;

        // Compute Detailed Income Category splits (All-Time / Total)
        List<com.Clinc_Flow.Clinic.income.IncomeRecord> allIncome = incomeRecordRepository.findAll();
        BigDecimal incDoc = BigDecimal.ZERO;
        BigDecimal incLab = BigDecimal.ZERO;
        BigDecimal incMed = BigDecimal.ZERO;
        BigDecimal incPat = BigDecimal.ZERO;
        BigDecimal incOth = BigDecimal.ZERO;
        for (com.Clinc_Flow.Clinic.income.IncomeRecord r : allIncome) {
            if ("CONSULTATION".equalsIgnoreCase(r.getIncomeType())) incDoc = incDoc.add(r.getAmount());
            else if ("LAB_COMMISSION".equalsIgnoreCase(r.getIncomeType())) incLab = incLab.add(r.getAmount());
            else if ("MEDICINE_SALE".equalsIgnoreCase(r.getIncomeType())) incMed = incMed.add(r.getAmount());
            else if ("APPOINTMENT".equalsIgnoreCase(r.getIncomeType())) incPat = incPat.add(r.getAmount());
            else incOth = incOth.add(r.getAmount());
        }

        // Compute Detailed Expense Category splits (All-Time / Total)
        List<com.Clinc_Flow.Clinic.expense.Expense> allExpenses = expenseRepository.findAll();
        BigDecimal expRent = BigDecimal.ZERO;
        BigDecimal expLight = BigDecimal.ZERO;
        BigDecimal expMaint = BigDecimal.ZERO;
        BigDecimal expOth = BigDecimal.ZERO;
        for (com.Clinc_Flow.Clinic.expense.Expense e : allExpenses) {
            String cat = (e.getExpenseCategory() != null ? e.getExpenseCategory() : "").toLowerCase();
            if (cat.contains("rent")) expRent = expRent.add(e.getAmount());
            else if (cat.contains("light") || cat.contains("electricity") || cat.contains("power") || cat.contains("bill")) expLight = expLight.add(e.getAmount());
            else if (cat.contains("maintenance") || cat.contains("repair") || cat.contains("clean")) expMaint = expMaint.add(e.getAmount());
            else expOth = expOth.add(e.getAmount());
        }

        // Compute Doctor Statistics list
        List<AdminDashboardResponse.DoctorStats> doctorStatsList = new ArrayList<>();
        for (com.Clinc_Flow.Clinic.doctor.Doctor d : doctorRepository.findAll()) {
            long apptCount = appointmentRepository.countByDoctorId(d.getId());
            doctorStatsList.add(AdminDashboardResponse.DoctorStats.builder()
                    .name(d.getName())
                    .specialty(d.getSpecialization())
                    .appointmentCount(apptCount)
                    .isActive(d.getIsActive())
                    .build());
        }

        // Compute Staff Statistics list
        List<AdminDashboardResponse.StaffStats> staffStatsList = new ArrayList<>();
        for (com.Clinc_Flow.Clinic.staff.DoctorStaff ds : doctorStaffRepository.findAll()) {
            User u = userRepository.findById(ds.getStaffUserId()).orElse(null);
            String name = u != null ? u.getName() : "Unknown";
            String roleTitle = "Staff";
            String dutyTime = "Not Set";
            BigDecimal salary = BigDecimal.ZERO;

            Optional<StaffDetails> sd = staffDetailsRepository.findByDoctorStaffId(ds.getId());
            if (sd.isPresent()) {
                roleTitle = sd.get().getRoleTitle();
                dutyTime = sd.get().getDutyTime() != null ? sd.get().getDutyTime() : "Not Set";
            }
            Optional<com.Clinc_Flow.Clinic.compensation.StaffCompensation> sc = staffCompensationRepository.findByDoctorStaffId(ds.getId());
            if (sc.isPresent()) {
                salary = sc.get().getFixedSalary() != null ? sc.get().getFixedSalary() : BigDecimal.ZERO;
            }

            staffStatsList.add(AdminDashboardResponse.StaffStats.builder()
                    .name(name)
                    .roleTitle(roleTitle)
                    .dutyTime(dutyTime)
                    .fixedSalary(salary)
                    .build());
        }

        return AdminDashboardResponse.builder()
                .todayAppointments(todayAppts)
                .completedAppointments(completedToday)
                .pendingAppointments(pendingToday)
                .upcomingAppointments(upcomingAppts)
                .totalPatients(totalPatients)
                .totalDoctors(totalDoctors)
                .totalActiveDoctors(totalActiveDoctors)
                .totalStaff(totalStaff)
                .todayRevenue(todayRevenue)
                .monthlyRevenue(monthlyRevenue)
                .totalRevenue(totalRevenue)
                .todayExpenses(todayExp)
                .monthlyExpenses(monthlyExp)
                .netProfit(netProfit)
                .lowStockItems(lowStock)
                .expiringItems(expiring)
                .pendingFollowUps(pendingFU)
                .todayNewPatients(todayNewPats)
                .monthlyNewPatients(monthlyNewPats)
                .totalBills(totalBills)
                .pendingBills(pendingBills)
                .incomeDoctors(incDoc)
                .incomeLab(incLab)
                .incomeMedicals(incMed)
                .incomePatients(incPat)
                .incomeOther(incOth)
                .expenseRent(expRent)
                .expenseLightBill(expLight)
                .expenseMaintenance(expMaint)
                .expenseOther(expOth)
                .doctorStats(doctorStatsList)
                .staffStats(staffStatsList)
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdminRevenueTrendResponse> getRevenueTrend(int months) {
        List<AdminRevenueTrendResponse> trends = new ArrayList<>();
        YearMonth startMonth = YearMonth.now().minusMonths(months - 1);
        for (int i = 0; i < months; i++) {
            YearMonth ym = startMonth.plusMonths(i);
            OffsetDateTime monthFrom = ym.atDay(1).atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();
            OffsetDateTime monthTo = ym.plusMonths(1).atDay(1).atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();

            BigDecimal rev = incomeRecordRepository.totalIncomeBetween(monthFrom, monthTo);
            BigDecimal exp = expenseRepository.totalExpenseBetween(monthFrom, monthTo);
            trends.add(AdminRevenueTrendResponse.builder()
                    .year(ym.getYear())
                    .month(ym.getMonthValue())
                    .revenue(rev != null ? rev : BigDecimal.ZERO)
                    .expense(exp != null ? exp : BigDecimal.ZERO)
                    .build());
        }
        return trends;
    }
}
