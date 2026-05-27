package com.Clinc_Flow.Clinic.appointment.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class VisitNotesRequest {
    private String diagnosis;
    private String prescription;
    private String additionalNotes;
}
