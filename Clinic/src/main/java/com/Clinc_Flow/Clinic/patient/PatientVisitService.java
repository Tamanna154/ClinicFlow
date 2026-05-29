package com.Clinc_Flow.Clinic.patient;

import com.Clinc_Flow.Clinic.doctor.Doctor;
import com.Clinc_Flow.Clinic.doctor.DoctorRepository;
import com.Clinc_Flow.Clinic.exception.ResourceNotFoundException;
import com.Clinc_Flow.Clinic.patient.dto.PatientVisitRequest;
import com.Clinc_Flow.Clinic.patient.dto.PatientVisitResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientVisitService {

    private final PatientVisitRepository patientVisitRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    @Transactional
    public PatientVisitResponse createVisit(PatientVisitRequest request) {
        patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", request.getPatientId()));

        PatientVisit visit = PatientVisit.builder()
                .patientId(request.getPatientId())
                .diagnosis(request.getDiagnosis())
                .prescription(request.getPrescription())
                .additionalNotes(request.getAdditionalNotes())
                .build();

        return PatientVisitResponse.fromEntity(patientVisitRepository.save(visit), null);
    }

    @Transactional
    public PatientVisitResponse createVisit(PatientVisitRequest request, Long doctorId, Long appointmentId) {
        patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", request.getPatientId()));

        PatientVisit visit = PatientVisit.builder()
                .patientId(request.getPatientId())
                .doctorId(doctorId)
                .appointmentId(appointmentId)
                .diagnosis(request.getDiagnosis())
                .prescription(request.getPrescription())
                .additionalNotes(request.getAdditionalNotes())
                .visitDate(OffsetDateTime.now())
                .build();

        return PatientVisitResponse.fromEntity(patientVisitRepository.save(visit), null);
    }

    @Transactional(readOnly = true)
    public List<PatientVisitResponse> getVisitsByPatientId(Long patientId) {
        List<PatientVisit> visits = patientVisitRepository.findByPatientIdOrderByVisitDateDesc(patientId);
        List<Long> doctorIds = visits.stream()
                .map(PatientVisit::getDoctorId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();
        java.util.Map<Long, String> doctorNames = doctorRepository.findAllById(doctorIds).stream()
                .collect(java.util.stream.Collectors.toMap(Doctor::getId, Doctor::getName));
        return visits.stream()
                .map(visit -> PatientVisitResponse.fromEntity(visit, doctorNames.get(visit.getDoctorId())))
                .toList();
    }
}
