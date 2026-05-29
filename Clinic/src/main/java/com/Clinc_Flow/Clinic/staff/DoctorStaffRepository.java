package com.Clinc_Flow.Clinic.staff;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DoctorStaffRepository extends JpaRepository<DoctorStaff, Long> {
    List<DoctorStaff> findByDoctorUserId(Long doctorUserId);
    Optional<DoctorStaff> findByStaffUserId(Long staffUserId);
    boolean existsByStaffUserId(Long staffUserId);
    void deleteByStaffUserId(Long staffUserId);
}
