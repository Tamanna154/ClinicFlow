package com.Clinc_Flow.Clinic.medication;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PatientMedicationRepository extends JpaRepository<PatientMedication, Long> {
    List<PatientMedication> findByPatientId(Long patientId);
}
