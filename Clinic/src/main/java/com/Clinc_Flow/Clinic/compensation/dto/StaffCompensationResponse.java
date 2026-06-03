package com.Clinc_Flow.Clinic.compensation.dto;

import com.Clinc_Flow.Clinic.compensation.StaffCompensation;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffCompensationResponse {
    private Long id;
    private Long staffId;
    private String staffName;
    private BigDecimal fixedSalary;
    private BigDecimal incentivePercent;
    private BigDecimal performanceBonus;
    private Boolean isActive;

    public static StaffCompensationResponse fromEntity(StaffCompensation comp) {
        return StaffCompensationResponse.builder()
                .id(comp.getId())
                .staffId(comp.getDoctorStaffId())
                .fixedSalary(comp.getFixedSalary())
                .incentivePercent(comp.getIncentivePercent())
                .performanceBonus(comp.getPerformanceBonus())
                .isActive(comp.getIsActive())
                .build();
    }
}
