package com.Clinc_Flow.Clinic.compensation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface DoctorCompensationRepository extends JpaRepository<DoctorCompensation, Long> {
    Optional<DoctorCompensation> findByDoctorId(Long doctorId);
    boolean existsByDoctorId(Long doctorId);
}
