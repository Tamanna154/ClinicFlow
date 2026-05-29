package com.Clinc_Flow.Clinic.staff;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StaffDetailsRepository extends JpaRepository<StaffDetails, Long> {
    Optional<StaffDetails> findByDoctorStaffId(Long doctorStaffId);
    void deleteByDoctorStaffId(Long doctorStaffId);
}
