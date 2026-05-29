package com.Clinc_Flow.Clinic.staff;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StaffPermissionRepository extends JpaRepository<StaffPermission, Long> {
    List<StaffPermission> findByDoctorStaffId(Long doctorStaffId);
    void deleteByDoctorStaffId(Long doctorStaffId);
}
