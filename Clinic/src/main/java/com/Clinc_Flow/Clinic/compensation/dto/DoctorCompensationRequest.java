package com.Clinc_Flow.Clinic.compensation.dto;

import com.Clinc_Flow.Clinic.compensation.CompensationType;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorCompensationRequest {
    private CompensationType compensationType;
    private BigDecimal fixedSalary;
    private BigDecimal doctorSharePercent;
    private BigDecimal clinicSharePercent;
}
