package com.Clinc_Flow.Clinic.compensation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface StaffCompensationRepository extends JpaRepository<StaffCompensation, Long> {
    Optional<StaffCompensation> findByDoctorStaffId(Long doctorStaffId);
    boolean existsByDoctorStaffId(Long doctorStaffId);
}
