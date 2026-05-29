package com.Clinc_Flow.Clinic.consultation.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationRequest {

    private String symptoms;
    private String diagnosis;
    private String doctorNotes;

    private String bloodPressure;
    private Integer pulseRate;
    private BigDecimal weight;
    private BigDecimal height;
    private BigDecimal temperature;
    private BigDecimal oxygenLevel;

    private LocalDate followUpDate;
    private String followUpNotes;
}
