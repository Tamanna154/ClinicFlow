package com.Clinc_Flow.Clinic.compensation;

import com.Clinc_Flow.Clinic.compensation.dto.*;
import com.Clinc_Flow.Clinic.consultation.Consultation;
import com.Clinc_Flow.Clinic.consultation.ConsultationBill;
import com.Clinc_Flow.Clinic.consultation.ConsultationBillRepository;
import com.Clinc_Flow.Clinic.consultation.ConsultationRepository;
import com.Clinc_Flow.Clinic.doctor.Doctor;
import com.Clinc_Flow.Clinic.doctor.DoctorRepository;
import com.Clinc_Flow.Clinic.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorCompensationService {

    private final DoctorCompensationRepository compensationRepository;
    private final DoctorPayoutRepository payoutRepository;
    private final DoctorRepository doctorRepository;
    private final ConsultationRepository consultationRepository;
    private final ConsultationBillRepository consultationBillRepository;

    @Transactional(readOnly = true)
    public DoctorCompensationResponse getCompensation(Long doctorId) {
        DoctorCompensation comp = compensationRepository.findByDoctorId(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("DoctorCompensation", doctorId));
        return DoctorCompensationResponse.fromEntity(comp);
    }

    @Transactional
    public DoctorCompensationResponse createOrUpdate(Long doctorId, DoctorCompensationRequest request) {
        if (!doctorRepository.existsById(doctorId)) {
            throw new ResourceNotFoundException("Doctor", doctorId);
        }
        DoctorCompensation comp = compensationRepository.findByDoctorId(doctorId)
                .orElse(DoctorCompensation.builder().doctorId(doctorId).build());

        comp.setCompensationType(request.getCompensationType());
        comp.setFixedSalary(request.getFixedSalary());
        comp.setDoctorSharePercent(request.getDoctorSharePercent());
        comp.setClinicSharePercent(request.getClinicSharePercent());
        if (comp.getIsActive() == null) comp.setIsActive(true);

        return DoctorCompensationResponse.fromEntity(compensationRepository.save(comp));
    }

    @Transactional
    public void calculatePayouts(Long doctorId, LocalDate startDate, LocalDate endDate) {
        DoctorCompensation comp = compensationRepository.findByDoctorId(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("DoctorCompensation", doctorId));

        List<Consultation> consultations = consultationRepository
                .findByDoctorIdAndStatusOrderByCreatedAtDesc(doctorId, "COMPLETED")
                .stream()
                .filter(c -> {
                    LocalDate cd = c.getCreatedAt().toLocalDate();
                    return !cd.isBefore(startDate) && !cd.isAfter(endDate);
                })
                .toList();

        int totalConsultations = consultations.size();
        BigDecimal totalRevenue = BigDecimal.ZERO;

        for (Consultation c : consultations) {
            ConsultationBill bill = consultationBillRepository.findByConsultationId(c.getId()).orElse(null);
            if (bill != null) {
                totalRevenue = totalRevenue.add(bill.getTotalAmount());
            }
        }

        BigDecimal doctorEarnings = BigDecimal.ZERO;
        BigDecimal clinicShare = BigDecimal.ZERO;

        switch (comp.getCompensationType()) {
            case FIXED_SALARY:
                doctorEarnings = comp.getFixedSalary() != null ? comp.getFixedSalary() : BigDecimal.ZERO;
                clinicShare = totalRevenue.subtract(doctorEarnings);
                break;
            case REVENUE_SHARING:
                if (comp.getDoctorSharePercent() != null) {
                    doctorEarnings = totalRevenue.multiply(
                            comp.getDoctorSharePercent().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
                }
                if (comp.getClinicSharePercent() != null) {
                    clinicShare = totalRevenue.multiply(
                            comp.getClinicSharePercent().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
                } else {
                    clinicShare = totalRevenue.subtract(doctorEarnings);
                }
                break;
            case HYBRID:
                BigDecimal fixedPortion = comp.getFixedSalary() != null ? comp.getFixedSalary() : BigDecimal.ZERO;
                BigDecimal revenuePortion = BigDecimal.ZERO;
                if (comp.getDoctorSharePercent() != null) {
                    revenuePortion = totalRevenue.multiply(
                            comp.getDoctorSharePercent().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
                }
                doctorEarnings = fixedPortion.add(revenuePortion);
                clinicShare = totalRevenue.subtract(doctorEarnings);
                if (clinicShare.compareTo(BigDecimal.ZERO) < 0) clinicShare = BigDecimal.ZERO;
                break;
        }

        DoctorPayout payout = DoctorPayout.builder()
                .doctorId(doctorId)
                .periodStart(startDate)
                .periodEnd(endDate)
                .totalConsultations(totalConsultations)
                .totalRevenue(totalRevenue)
                .doctorEarnings(doctorEarnings)
                .clinicShare(clinicShare)
                .status("PENDING")
                .build();

        payoutRepository.save(payout);
    }

    @Transactional(readOnly = true)
    public DoctorEarningsSummaryResponse getEarningsSummary(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", doctorId));

        List<Consultation> consultations = consultationRepository
                .findByDoctorIdAndStatusOrderByCreatedAtDesc(doctorId, "COMPLETED");

        int totalConsultations = consultations.size();
        BigDecimal totalRevenue = BigDecimal.ZERO;

        for (Consultation c : consultations) {
            ConsultationBill bill = consultationBillRepository.findByConsultationId(c.getId()).orElse(null);
            if (bill != null) {
                totalRevenue = totalRevenue.add(bill.getTotalAmount());
            }
        }

        DoctorCompensation comp = compensationRepository.findByDoctorId(doctorId).orElse(null);
        BigDecimal doctorEarnings = BigDecimal.ZERO;
        BigDecimal clinicShare = BigDecimal.ZERO;

        if (comp != null) {
            switch (comp.getCompensationType()) {
                case FIXED_SALARY:
                    doctorEarnings = comp.getFixedSalary() != null ? comp.getFixedSalary() : BigDecimal.ZERO;
                    clinicShare = totalRevenue.subtract(doctorEarnings);
                    break;
                case REVENUE_SHARING:
                    if (comp.getDoctorSharePercent() != null) {
                        doctorEarnings = totalRevenue.multiply(
                                comp.getDoctorSharePercent().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
                    }
                    if (comp.getClinicSharePercent() != null) {
                        clinicShare = totalRevenue.multiply(
                                comp.getClinicSharePercent().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
                    } else {
                        clinicShare = totalRevenue.subtract(doctorEarnings);
                    }
                    break;
                case HYBRID:
                    BigDecimal fixedPortion = comp.getFixedSalary() != null ? comp.getFixedSalary() : BigDecimal.ZERO;
                    BigDecimal revenuePortion = BigDecimal.ZERO;
                    if (comp.getDoctorSharePercent() != null) {
                        revenuePortion = totalRevenue.multiply(
                                comp.getDoctorSharePercent().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
                    }
                    doctorEarnings = fixedPortion.add(revenuePortion);
                    clinicShare = totalRevenue.subtract(doctorEarnings);
                    if (clinicShare.compareTo(BigDecimal.ZERO) < 0) clinicShare = BigDecimal.ZERO;
                    break;
            }
        }

        List<DoctorPayout> pendingPayouts = payoutRepository.findByDoctorIdAndStatus(doctorId, "PENDING");
        List<DoctorPayout> paidPayouts = payoutRepository.findByDoctorIdAndStatus(doctorId, "PAID");

        return DoctorEarningsSummaryResponse.builder()
                .doctorId(doctorId)
                .doctorName(doctor.getName())
                .totalConsultations(totalConsultations)
                .totalRevenue(totalRevenue)
                .doctorEarnings(doctorEarnings)
                .clinicShare(clinicShare)
                .pendingPayouts(pendingPayouts.size())
                .paidPayouts(paidPayouts.size())
                .build();
    }

    @Transactional(readOnly = true)
    public List<DoctorPayoutResponse> getPayoutHistory(Long doctorId) {
        return payoutRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId).stream()
                .map(p -> {
                    DoctorPayoutResponse resp = DoctorPayoutResponse.fromEntity(p);
                    doctorRepository.findById(doctorId)
                            .ifPresent(d -> resp.setDoctorName(d.getName()));
                    return resp;
                })
                .toList();
    }
}
