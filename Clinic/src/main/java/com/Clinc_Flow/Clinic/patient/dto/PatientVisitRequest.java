package com.Clinc_Flow.Clinic.patient.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientVisitRequest {
    private Long patientId;
    private String diagnosis;
    private String prescription;
    private String additionalNotes;
}
