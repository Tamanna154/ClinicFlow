package com.Clinc_Flow.Clinic.prescription;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<Prescription> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);
    Optional<Prescription> findByConsultationId(Long consultationId);
    Optional<Prescription> findByPrescriptionNumber(String prescriptionNumber);
    List<Prescription> findByPatientIdAndConsultationIdIsNotNullOrderByCreatedAtDesc(Long patientId);

    List<Prescription> findAllByOrderByCreatedAtDesc();
}
