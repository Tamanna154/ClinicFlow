package com.Clinc_Flow.Clinic.medication;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PatientMealTimingsRepository extends JpaRepository<PatientMealTimings, Long> {
    Optional<PatientMealTimings> findByPatientId(Long patientId);
}
