package com.Clinc_Flow.Clinic.salary;

import com.Clinc_Flow.Clinic.compensation.StaffCompensationRepository;
import com.Clinc_Flow.Clinic.staff.DoctorStaff;
import com.Clinc_Flow.Clinic.staff.DoctorStaffRepository;
import com.Clinc_Flow.Clinic.staff.StaffDetails;
import com.Clinc_Flow.Clinic.staff.StaffDetailsRepository;
import com.Clinc_Flow.Clinic.user.User;
import com.Clinc_Flow.Clinic.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SalaryPaymentService {

    private final SalaryPaymentRepository salaryPaymentRepository;
    private final DoctorStaffRepository doctorStaffRepository;
    private final StaffDetailsRepository staffDetailsRepository;
    private final StaffCompensationRepository staffCompensationRepository;
    private final UserRepository userRepository;

    @Transactional
    public SalaryPaymentResponse paySalary(SalaryPaymentRequest request, Long paidByUserId) {
        DoctorStaff ds = doctorStaffRepository.findById(request.getStaffId())
                .orElseThrow(() -> new IllegalArgumentException("Staff record not found"));

        StaffDetails details = staffDetailsRepository.findByDoctorStaffId(ds.getId())
                .orElse(null);

        BigDecimal fixedSalary = staffCompensationRepository.findByDoctorStaffId(ds.getId())
                .map(c -> c.getFixedSalary() != null ? c.getFixedSalary() : BigDecimal.ZERO)
                .orElse(BigDecimal.ZERO);

        SalaryPayment payment = SalaryPayment.builder()
                .staffId(request.getStaffId())
                .amount(request.getAmount())
                .paymentDate(LocalDate.now())
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "CASH")
                .status("PAID")
                .notes(request.getNotes())
                .paidBy(paidByUserId)
                .transactionRef(request.getTransactionRef())
                .build();

        payment = salaryPaymentRepository.save(payment);

        if (details != null) {
            details.setLastPaymentDate(LocalDate.now());
            details.setLastPaymentAmount(request.getAmount());
            BigDecimal currentTotal = details.getTotalPaid() != null ? details.getTotalPaid() : BigDecimal.ZERO;
            details.setTotalPaid(currentTotal.add(request.getAmount()));
            BigDecimal pending = fixedSalary.subtract(details.getTotalPaid());
            if (pending.compareTo(BigDecimal.ZERO) < 0) {
                pending = BigDecimal.ZERO;
            }
            details.setPendingSalary(pending);
            staffDetailsRepository.save(details);
        }

        return mapToResponse(payment, ds, details);
    }

    @Transactional(readOnly = true)
    public List<SalaryPaymentResponse> getAllPayments(Long userId, boolean isAdmin) {
        List<SalaryPayment> payments;
        if (isAdmin) {
            payments = salaryPaymentRepository.findAllByOrderByPaymentDateDesc();
        } else {
            List<DoctorStaff> staffList = doctorStaffRepository.findByDoctorUserId(userId);
            List<Long> staffIds = staffList.stream().map(DoctorStaff::getId).toList();
            payments = new ArrayList<>();
            for (Long sid : staffIds) {
                payments.addAll(salaryPaymentRepository.findByStaffIdOrderByPaymentDateDesc(sid));
            }
        }
        return payments.stream().map(p -> {
            DoctorStaff ds = doctorStaffRepository.findById(p.getStaffId()).orElse(null);
            StaffDetails sdetails = ds != null ? staffDetailsRepository.findByDoctorStaffId(ds.getId()).orElse(null) : null;
            return mapToResponse(p, ds, sdetails);
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<SalaryPaymentResponse> getPaymentHistory(Long staffId) {
        List<SalaryPayment> payments = salaryPaymentRepository.findByStaffIdOrderByPaymentDateDesc(staffId);
        DoctorStaff ds = doctorStaffRepository.findById(staffId).orElse(null);
        StaffDetails sdetails = ds != null ? staffDetailsRepository.findByDoctorStaffId(ds.getId()).orElse(null) : null;
        return payments.stream().map(p -> mapToResponse(p, ds, sdetails)).toList();
    }

    private SalaryPaymentResponse mapToResponse(SalaryPayment payment, DoctorStaff ds, StaffDetails details) {
        String staffName = "";
        String staffRole = "";
        BigDecimal fixedSalary = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal pendingSalary = BigDecimal.ZERO;

        if (ds != null) {
            User user = userRepository.findById(ds.getStaffUserId()).orElse(null);
            if (user != null) {
                staffName = user.getName() != null ? user.getName() : "";
                staffRole = details != null && details.getRoleTitle() != null
                        ? details.getRoleTitle() : user.getRole().name();
                fixedSalary = staffCompensationRepository.findByDoctorStaffId(ds.getId())
                        .map(c -> c.getFixedSalary() != null ? c.getFixedSalary() : BigDecimal.ZERO)
                        .orElse(BigDecimal.ZERO);
                totalPaid = details != null && details.getTotalPaid() != null
                        ? details.getTotalPaid() : BigDecimal.ZERO;
                pendingSalary = details != null && details.getPendingSalary() != null
                        ? details.getPendingSalary() : BigDecimal.ZERO;
            }
        }

        return SalaryPaymentResponse.builder()
                .id(payment.getId())
                .staffId(payment.getStaffId())
                .staffName(staffName)
                .staffRole(staffRole)
                .amount(payment.getAmount())
                .paymentDate(payment.getPaymentDate())
                .paymentMethod(payment.getPaymentMethod())
                .status(payment.getStatus())
                .notes(payment.getNotes())
                .transactionRef(payment.getTransactionRef())
                .fixedSalary(fixedSalary)
                .totalPaid(totalPaid)
                .pendingSalary(pendingSalary)
                .build();
    }
}
