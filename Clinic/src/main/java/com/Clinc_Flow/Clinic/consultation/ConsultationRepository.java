package com.Clinc_Flow.Clinic.consultation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, Long> {

    Optional<Consultation> findByAppointmentId(Long appointmentId);

    List<Consultation> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    List<Consultation> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);

    List<Consultation> findByDoctorIdAndStatusOrderByCreatedAtDesc(Long doctorId, String status);
}
