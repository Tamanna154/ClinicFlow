package com.Clinc_Flow.Clinic.doctor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    List<Doctor> findByNameContainingIgnoreCase(String name);

    List<Doctor> findBySpecializationContainingIgnoreCase(String specialization);

    List<Doctor> findByIsActiveTrue();

    boolean existsByEmail(String email);
}
