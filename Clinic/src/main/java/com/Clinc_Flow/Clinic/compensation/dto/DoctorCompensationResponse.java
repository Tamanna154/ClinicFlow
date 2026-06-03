package com.Clinc_Flow.Clinic.compensation.dto;

import com.Clinc_Flow.Clinic.compensation.CompensationType;
import com.Clinc_Flow.Clinic.compensation.DoctorCompensation;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorCompensationResponse {
    private Long id;
    private Long doctorId;
    private CompensationType compensationType;
    private BigDecimal fixedSalary;
    private BigDecimal doctorSharePercent;
    private BigDecimal clinicSharePercent;
    private Boolean isActive;

    public static DoctorCompensationResponse fromEntity(DoctorCompensation comp) {
        return DoctorCompensationResponse.builder()
                .id(comp.getId())
                .doctorId(comp.getDoctorId())
                .compensationType(comp.getCompensationType())
                .fixedSalary(comp.getFixedSalary())
                .doctorSharePercent(comp.getDoctorSharePercent())
                .clinicSharePercent(comp.getClinicSharePercent())
                .isActive(comp.getIsActive())
                .build();
    }
}
