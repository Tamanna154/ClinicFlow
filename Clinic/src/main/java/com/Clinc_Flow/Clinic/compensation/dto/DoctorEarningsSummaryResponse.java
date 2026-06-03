package com.Clinc_Flow.Clinic.compensation.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorEarningsSummaryResponse {
    private Long doctorId;
    private String doctorName;
    private Integer totalConsultations;
    private BigDecimal totalRevenue;
    private BigDecimal doctorEarnings;
    private BigDecimal clinicShare;
    private Integer pendingPayouts;
    private Integer paidPayouts;
}
