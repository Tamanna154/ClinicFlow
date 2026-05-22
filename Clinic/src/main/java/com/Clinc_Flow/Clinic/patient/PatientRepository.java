package com.Clinc_Flow.Clinic.patient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    List<Patient> findByNameContainingIgnoreCase(String name);

    List<Patient> findByPhoneContaining(String phone);
}
