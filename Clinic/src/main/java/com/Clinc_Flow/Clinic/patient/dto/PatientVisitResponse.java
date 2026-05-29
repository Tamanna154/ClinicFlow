package com.Clinc_Flow.Clinic.patient.dto;

import com.Clinc_Flow.Clinic.patient.PatientVisit;
import lombok.*;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientVisitResponse {

    private Long id;
    private Long patientId;
    private Long doctorId;
    private String doctorName;
    private Long appointmentId;
    private OffsetDateTime visitDate;
    private String diagnosis;
    private String prescription;
    private String additionalNotes;
    private OffsetDateTime createdAt;

    public static PatientVisitResponse fromEntity(PatientVisit visit, String doctorName) {
        return PatientVisitResponse.builder()
                .id(visit.getId())
                .patientId(visit.getPatientId())
                .doctorId(visit.getDoctorId())
                .doctorName(doctorName)
                .appointmentId(visit.getAppointmentId())
                .visitDate(visit.getVisitDate())
                .diagnosis(visit.getDiagnosis())
                .prescription(visit.getPrescription())
                .additionalNotes(visit.getAdditionalNotes())
                .createdAt(visit.getCreatedAt())
                .build();
    }
}
