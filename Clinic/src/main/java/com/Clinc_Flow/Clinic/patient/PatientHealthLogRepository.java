package com.Clinc_Flow.Clinic.patient;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PatientHealthLogRepository extends JpaRepository<PatientHealthLog, Long> {
    List<PatientHealthLog> findByPatientIdOrderByMeasuredAtDesc(Long patientId);
}
