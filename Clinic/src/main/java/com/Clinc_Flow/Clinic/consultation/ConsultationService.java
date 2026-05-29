package com.Clinc_Flow.Clinic.consultation;

import com.Clinc_Flow.Clinic.appointment.Appointment;
import com.Clinc_Flow.Clinic.appointment.AppointmentRepository;
import com.Clinc_Flow.Clinic.consultation.dto.*;
import com.Clinc_Flow.Clinic.exception.ResourceNotFoundException;
import com.Clinc_Flow.Clinic.income.IncomeRecord;
import com.Clinc_Flow.Clinic.income.IncomeRecordRepository;
import com.Clinc_Flow.Clinic.patient.Patient;
import com.Clinc_Flow.Clinic.patient.PatientRepository;
import com.Clinc_Flow.Clinic.patient.PatientVisit;
import com.Clinc_Flow.Clinic.patient.PatientVisitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final ConsultationBillRepository consultationBillRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final PatientVisitRepository patientVisitRepository;
    private final IncomeRecordRepository incomeRecordRepository;

    @Transactional
    public ConsultationResponse startConsultation(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", appointmentId));

        if (consultationRepository.findByAppointmentId(appointmentId).isPresent()) {
            throw new IllegalArgumentException("Consultation already exists for this appointment");
        }

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        if (appointment.getAppointmentDate().isAfter(today)) {
            throw new IllegalArgumentException("Cannot start consultation: Appointment is scheduled for " + appointment.getAppointmentDate() + ". Please wait until the appointment date.");
        }

        if (appointment.getAppointmentDate().isBefore(today)) {
            throw new IllegalArgumentException("Cannot start consultation: Appointment was on " + appointment.getAppointmentDate() + " (past date). Please reschedule if needed.");
        }

        if (now.isBefore(appointment.getStartTime())) {
            throw new IllegalArgumentException("Cannot start consultation: Appointment starts at " + appointment.getStartTime() + ". Current time is " + now.format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")) + ". Please wait until the scheduled time.");
        }

        appointment.setStatus("IN_PROGRESS");
        appointmentRepository.save(appointment);

        Consultation consultation = Consultation.builder()
                .appointment(appointment)
                .patientId(appointment.getPatient().getId())
                .doctorId(appointment.getDoctor().getId())
                .status("IN_PROGRESS")
                .build();
        consultation = consultationRepository.save(consultation);

        return ConsultationResponse.fromEntity(consultation);
    }

    @Transactional
    public ConsultationResponse updateConsultation(Long consultationId, ConsultationRequest request) {
        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation", consultationId));

        consultation.setSymptoms(request.getSymptoms());
        consultation.setDiagnosis(request.getDiagnosis());
        consultation.setDoctorNotes(request.getDoctorNotes());
        consultation.setBloodPressure(request.getBloodPressure());
        consultation.setPulseRate(request.getPulseRate());
        consultation.setWeight(request.getWeight());
        consultation.setHeight(request.getHeight());
        consultation.setTemperature(request.getTemperature());
        consultation.setOxygenLevel(request.getOxygenLevel());
        consultation.setFollowUpDate(request.getFollowUpDate());
        consultation.setFollowUpNotes(request.getFollowUpNotes());

        consultation = consultationRepository.save(consultation);
        return ConsultationResponse.fromEntity(consultation);
    }

    @Transactional
    public ConsultationResponse completeConsultation(Long consultationId) {
        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation", consultationId));

        consultation.setStatus("COMPLETED");
        Consultation saved = consultationRepository.save(consultation);

        Appointment appointment = saved.getAppointment();
        appointment.setStatus("COMPLETED");
        appointment.setConsultationNotes(saved.getDoctorNotes());
        appointmentRepository.save(appointment);

        Long patId = saved.getPatientId();
        Patient patient = patientRepository.findById(patId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", patId));

        StringBuilder history = new StringBuilder();
        Consultation c = saved;
        if (patient.getMedicalHistory() != null) {
            history.append(patient.getMedicalHistory()).append("\n\n");
        }
        history.append("--- Visit: ").append(LocalDate.now()).append(" ---\n");
        if (c.getSymptoms() != null && !c.getSymptoms().isEmpty()) {
            history.append("Symptoms: ").append(c.getSymptoms()).append("\n");
        }
        if (c.getDiagnosis() != null && !c.getDiagnosis().isEmpty()) {
            history.append("Diagnosis: ").append(c.getDiagnosis()).append("\n");
        }
        if (c.getDoctorNotes() != null && !c.getDoctorNotes().isEmpty()) {
            history.append("Notes: ").append(c.getDoctorNotes()).append("\n");
        }
        patient.setMedicalHistory(history.toString());
        patientRepository.save(patient);

        try {
            PatientVisit visit = PatientVisit.builder()
                    .patientId(c.getPatientId())
                    .doctorId(c.getDoctorId())
                    .appointmentId(appointment.getId())
                    .visitDate(OffsetDateTime.now())
                    .diagnosis(c.getDiagnosis())
                    .prescription(c.getDoctorNotes())
                    .additionalNotes(c.getSymptoms())
                    .build();
            patientVisitRepository.save(visit);
        } catch (Exception e) {
            log.warn("Failed to create patient visit: {}", e.getMessage());
        }

        return ConsultationResponse.fromEntity(consultation);
    }

    @Transactional(readOnly = true)
    public ConsultationResponse getConsultation(Long id) {
        Consultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation", id));
        ConsultationResponse resp = ConsultationResponse.fromEntity(consultation);
        consultationBillRepository.findByConsultationId(id).ifPresent(bill ->
                resp.setBill(ConsultationResponse.ConsultationBillInfo.builder()
                        .id(bill.getId())
                        .subtotal(bill.getSubtotal())
                        .discount(bill.getDiscount())
                        .tax(bill.getTax())
                        .totalAmount(bill.getTotalAmount())
                        .paymentStatus(bill.getPaymentStatus())
                        .paymentMethod(bill.getPaymentMethod())
                        .build()));
        return resp;
    }

    @Transactional(readOnly = true)
    public ConsultationResponse getConsultationByAppointment(Long appointmentId) {
        Consultation consultation = consultationRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation", appointmentId));
        ConsultationResponse resp = ConsultationResponse.fromEntity(consultation);
        consultationBillRepository.findByConsultationId(consultation.getId()).ifPresent(bill ->
                resp.setBill(ConsultationResponse.ConsultationBillInfo.builder()
                        .id(bill.getId())
                        .subtotal(bill.getSubtotal())
                        .discount(bill.getDiscount())
                        .tax(bill.getTax())
                        .totalAmount(bill.getTotalAmount())
                        .paymentStatus(bill.getPaymentStatus())
                        .paymentMethod(bill.getPaymentMethod())
                        .build()));
        return resp;
    }

    @Transactional(readOnly = true)
    public List<ConsultationResponse> getPatientHistory(Long patientId) {
        return consultationRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
                .map(c -> {
                    ConsultationResponse resp = ConsultationResponse.fromEntity(c);
                    consultationBillRepository.findByConsultationId(c.getId()).ifPresent(bill ->
                            resp.setBill(ConsultationResponse.ConsultationBillInfo.builder()
                                    .id(bill.getId())
                                    .totalAmount(bill.getTotalAmount())
                                    .paymentStatus(bill.getPaymentStatus())
                                    .build()));
                    return resp;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public ConsultationBillResponse generateBill(Long consultationId, ConsultationBillRequest request, Long userId) {
        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation", consultationId));

        if (consultationBillRepository.findByConsultationId(consultationId).isPresent()) {
            throw new IllegalArgumentException("Bill already generated for this consultation");
        }

        BigDecimal consultationFee = request.getConsultationFee() != null ? request.getConsultationFee() : BigDecimal.ZERO;
        BigDecimal additionalCharges = request.getAdditionalCharges() != null ? request.getAdditionalCharges() : BigDecimal.ZERO;
        BigDecimal discount = request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO;
        BigDecimal tax = request.getTax() != null ? request.getTax() : BigDecimal.ZERO;

        BigDecimal subtotal = consultationFee.add(additionalCharges);
        BigDecimal totalAmount = subtotal.subtract(discount).add(tax);
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) totalAmount = BigDecimal.ZERO;

        Appointment appointment = consultation.getAppointment();

        ConsultationBill bill = ConsultationBill.builder()
                .consultationId(consultationId)
                .consultationFee(consultationFee)
                .additionalCharges(additionalCharges)
                .additionalChargesDescription(request.getAdditionalChargesDescription())
                .subtotal(subtotal)
                .discount(discount)
                .tax(tax)
                .totalAmount(totalAmount)
                .paymentStatus(request.getPaymentStatus() != null ? request.getPaymentStatus() : "PENDING")
                .paymentMethod(request.getPaymentMethod())
                .createdBy(userId)
                .build();
        bill = consultationBillRepository.save(bill);

        appointment.setAppointmentFee(totalAmount);
        appointment.setFeePaymentStatus(bill.getPaymentStatus());
        appointment.setFeePaymentMethod(request.getPaymentMethod());
        if ("PAID".equalsIgnoreCase(bill.getPaymentStatus())) {
            appointment.setFeePaymentDate(OffsetDateTime.now());
        }
        appointmentRepository.save(appointment);

        if ("PAID".equalsIgnoreCase(bill.getPaymentStatus())) {
            createIncomeRecord(consultation, bill.getTotalAmount(), request.getPaymentMethod(), userId);
        }

        return ConsultationBillResponse.fromEntity(bill);
    }

    @Transactional
    public ConsultationBillResponse recordPayment(Long consultationId, String paymentStatus, String paymentMethod, Long userId) {
        ConsultationBill bill = consultationBillRepository.findByConsultationId(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation bill", consultationId));

        if ("PAID".equalsIgnoreCase(bill.getPaymentStatus())) {
            throw new IllegalArgumentException("Payment already completed");
        }

        bill.setPaymentStatus(paymentStatus);
        bill.setPaymentMethod(paymentMethod);
        if ("PAID".equalsIgnoreCase(paymentStatus)) {
            bill.setPaymentDate(OffsetDateTime.now());
        }
        bill = consultationBillRepository.save(bill);

        Appointment appointment = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation", consultationId))
                .getAppointment();
        appointment.setFeePaymentStatus(paymentStatus);
        appointment.setFeePaymentMethod(paymentMethod);
        if ("PAID".equalsIgnoreCase(paymentStatus)) {
            appointment.setFeePaymentDate(OffsetDateTime.now());
        }
        appointmentRepository.save(appointment);

        if ("PAID".equalsIgnoreCase(paymentStatus)) {
            Consultation consultation = consultationRepository.findById(consultationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Consultation", consultationId));
            createIncomeRecord(consultation, bill.getTotalAmount(), paymentMethod, userId);
        }

        return ConsultationBillResponse.fromEntity(bill);
    }

    @Transactional(readOnly = true)
    public ConsultationBillResponse getBill(Long consultationId) {
        ConsultationBill bill = consultationBillRepository.findByConsultationId(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation bill", consultationId));
        return ConsultationBillResponse.fromEntity(bill);
    }

    @Transactional(readOnly = true)
    public DoctorDashboardResponse getDoctorDashboard(Long doctorId) {
        LocalDate today = LocalDate.now();

        List<Appointment> todayAppts = appointmentRepository
                .findByDoctorIdAndAppointmentDateOrderByStartTime(doctorId, today);

        DoctorDashboardResponse.DoctorDashboardResponseBuilder builder = DoctorDashboardResponse.builder();

        builder.totalAppointmentsToday(todayAppts.size());

        List<Consultation> consultations = consultationRepository
                .findByDoctorIdOrderByCreatedAtDesc(doctorId);

        long completed = consultations.stream().filter(c -> "COMPLETED".equals(c.getStatus())).count();
        long pending = consultations.stream().filter(c -> "IN_PROGRESS".equals(c.getStatus())).count();

        builder.completedConsultations(completed);
        builder.pendingConsultations(pending);
        builder.upcomingAppointments(
                appointmentRepository.findByDoctorIdAndAppointmentDateOrderByStartTime(doctorId, today)
                        .stream().filter(a -> "SCHEDULED".equals(a.getStatus()) || "CONFIRMED".equals(a.getStatus())).count());

        List<ConsultationBill> todayBills = consultationBillRepository.findAll().stream()
                .filter(b -> b.getCreatedAt() != null
                        && b.getCreatedAt().toLocalDate().equals(today))
                .toList();

        BigDecimal consultationRev = BigDecimal.ZERO;
        BigDecimal medicineRev = BigDecimal.ZERO;
        for (ConsultationBill b : todayBills) {
            if ("PAID".equalsIgnoreCase(b.getPaymentStatus())) {
                consultationRev = consultationRev.add(b.getTotalAmount());
            }
        }

        List<Object[]> incomeData = incomeRecordRepository.sumByIncomeType();
        for (Object[] row : incomeData) {
            String type = (String) row[0];
            if ("CONSULTATION".equals(type)) {
                consultationRev = consultationRev.add((BigDecimal) row[1]);
            } else if ("MEDICINE_SALE".equals(type)) {
                medicineRev = medicineRev.add((BigDecimal) row[1]);
            }
        }

        builder.todayConsultationRevenue(consultationRev);
        builder.todayMedicineRevenue(medicineRev);
        builder.todayTotalRevenue(consultationRev.add(medicineRev));

        List<DoctorDashboardResponse.FollowUpItem> followUps = new ArrayList<>();
        for (Consultation c : consultations) {
            if (c.getFollowUpDate() != null && !c.getFollowUpDate().isBefore(today)) {
                patientRepository.findById(c.getPatientId()).ifPresent(p ->
                        followUps.add(DoctorDashboardResponse.FollowUpItem.builder()
                                .patientId(p.getId())
                                .patientName(p.getName())
                                .patientPhone(p.getPhone())
                                .followUpDate(c.getFollowUpDate())
                                .lastDiagnosis(c.getDiagnosis())
                                .build()));
            }
        }
        builder.followUps(followUps.stream().limit(10).toList());

        List<DoctorDashboardResponse.PendingPaymentItem> pendingPayments = new ArrayList<>();
        for (Consultation c : consultations) {
            consultationBillRepository.findByConsultationId(c.getId())
                    .filter(b -> !"PAID".equalsIgnoreCase(b.getPaymentStatus()))
                    .ifPresent(b -> patientRepository.findById(c.getPatientId()).ifPresent(p ->
                            pendingPayments.add(DoctorDashboardResponse.PendingPaymentItem.builder()
                                    .consultationId(c.getId())
                                    .patientId(p.getId())
                                    .patientName(p.getName())
                                    .amount(b.getTotalAmount())
                                    .date(c.getCreatedAt().toLocalDate())
                                    .build())));
        }
        builder.pendingPayments(pendingPayments.stream().limit(10).toList());

        List<DoctorDashboardResponse.TodayAppointmentItem> todayItems = new ArrayList<>();
        for (Appointment a : todayAppts) {
            var existingConsultation = consultationRepository.findByAppointmentId(a.getId());
            todayItems.add(DoctorDashboardResponse.TodayAppointmentItem.builder()
                    .appointmentId(a.getId())
                    .patientId(a.getPatient().getId())
                    .patientName(a.getPatient().getName())
                    .startTime(a.getStartTime().toString())
                    .endTime(a.getEndTime().toString())
                    .status(a.getStatus())
                    .isOnline(a.getIsOnline())
                    .consultationStatus(existingConsultation.map(Consultation::getStatus).orElse(null))
                    .build());
        }
        builder.todayAppointments(todayItems);

        return builder.build();
    }

    private void createIncomeRecord(Consultation consultation, BigDecimal amount, String paymentMethod, Long userId) {
        IncomeRecord record = IncomeRecord.builder()
                .incomeType("CONSULTATION")
                .referenceId(consultation.getId())
                .amount(amount)
                .paymentMethod(paymentMethod)
                .receivedBy(userId)
                .description("Consultation fee - " + (consultation.getDiagnosis() != null ? consultation.getDiagnosis() : "General consultation"))
                .build();
        incomeRecordRepository.save(record);
    }
}
