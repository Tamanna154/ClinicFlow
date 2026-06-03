package com.Clinc_Flow.Clinic.compensation.dto;

import com.Clinc_Flow.Clinic.compensation.DoctorPayout;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorPayoutResponse {
    private Long id;
    private Long doctorId;
    private String doctorName;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private Integer totalConsultations;
    private BigDecimal totalRevenue;
    private BigDecimal doctorEarnings;
    private BigDecimal clinicShare;
    private String status;
    private LocalDate paidDate;

    public static DoctorPayoutResponse fromEntity(DoctorPayout payout) {
        return DoctorPayoutResponse.builder()
                .id(payout.getId())
                .doctorId(payout.getDoctorId())
                .periodStart(payout.getPeriodStart())
                .periodEnd(payout.getPeriodEnd())
                .totalConsultations(payout.getTotalConsultations())
                .totalRevenue(payout.getTotalRevenue())
                .doctorEarnings(payout.getDoctorEarnings())
                .clinicShare(payout.getClinicShare())
                .status(payout.getStatus())
                .paidDate(payout.getPaidDate())
                .build();
    }
}
