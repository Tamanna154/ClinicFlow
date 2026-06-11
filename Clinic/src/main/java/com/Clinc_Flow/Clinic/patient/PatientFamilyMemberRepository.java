package com.Clinc_Flow.Clinic.patient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PatientFamilyMemberRepository extends JpaRepository<PatientFamilyMember, Long> {
    List<PatientFamilyMember> findByPatientId(Long patientId);
}
