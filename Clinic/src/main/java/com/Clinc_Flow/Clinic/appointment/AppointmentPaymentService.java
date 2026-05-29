package com.Clinc_Flow.Clinic.appointment;

import com.Clinc_Flow.Clinic.appointment.dto.AppointmentPaymentRequest;
import com.Clinc_Flow.Clinic.appointment.dto.AppointmentResponse;
import com.Clinc_Flow.Clinic.exception.ResourceNotFoundException;
import com.Clinc_Flow.Clinic.income.IncomeRecord;
import com.Clinc_Flow.Clinic.income.IncomeRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AppointmentPaymentService {

    private final AppointmentRepository appointmentRepository;
    private final IncomeRecordRepository incomeRecordRepository;

    @Transactional
    public AppointmentResponse recordPayment(Long appointmentId, AppointmentPaymentRequest request, Long userId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", appointmentId));

        if (!"COMPLETED".equalsIgnoreCase(appointment.getStatus())) {
            throw new IllegalArgumentException("Payment can only be recorded for completed appointments");
        }

        if ("PAID".equalsIgnoreCase(appointment.getFeePaymentStatus())) {
            throw new IllegalArgumentException("Payment already recorded for this appointment");
        }

        appointment.setAppointmentFee(request.getFeeAmount());
        appointment.setFeePaymentMethod(request.getPaymentMethod());
        appointment.setFeePaymentStatus(request.getPaymentStatus());
        appointment.setFeePaymentDate(OffsetDateTime.now());
        appointmentRepository.save(appointment);

        if ("PAID".equalsIgnoreCase(request.getPaymentStatus())) {
            IncomeRecord income = IncomeRecord.builder()
                    .incomeType("APPOINTMENT")
                    .referenceId(appointment.getId())
                    .amount(request.getFeeAmount())
                    .paymentMethod(request.getPaymentMethod())
                    .receivedBy(userId)
                    .description("Appointment fee - Dr. " + appointment.getDoctor().getName()
                            + " | Patient: " + appointment.getPatient().getName())
                    .build();
            incomeRecordRepository.save(income);
        }

        return AppointmentResponse.fromEntity(appointment);
    }

    public Map<String, Object> getRevenueSummary() {
        BigDecimal totalCollected = incomeRecordRepository.totalIncomeByTypeSince("APPOINTMENT", OffsetDateTime.now().minusYears(100));
        if (totalCollected == null) totalCollected = BigDecimal.ZERO;

        long paidCount = appointmentRepository.findByStatus("COMPLETED").stream()
                .filter(a -> "PAID".equalsIgnoreCase(a.getFeePaymentStatus()))
                .count();

        long pendingCount = appointmentRepository.findByStatus("COMPLETED").stream()
                .filter(a -> !"PAID".equalsIgnoreCase(a.getFeePaymentStatus()))
                .count();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalAppointmentRevenue", totalCollected);
        summary.put("paidAppointments", paidCount);
        summary.put("pendingPayments", pendingCount);
        return summary;
    }
}
