package com.Clinc_Flow.Clinic.compensation.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffCompensationRequest {
    private BigDecimal fixedSalary;
    private BigDecimal incentivePercent;
    private BigDecimal performanceBonus;
}
