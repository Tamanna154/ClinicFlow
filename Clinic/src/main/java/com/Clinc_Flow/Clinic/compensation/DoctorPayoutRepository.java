package com.Clinc_Flow.Clinic.compensation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface DoctorPayoutRepository extends JpaRepository<DoctorPayout, Long> {
    List<DoctorPayout> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);
    List<DoctorPayout> findByDoctorIdAndStatus(Long doctorId, String status);
    List<DoctorPayout> findByDoctorIdAndPeriodStartGreaterThanEqualAndPeriodEndLessThanEqual(
            Long doctorId, LocalDate start, LocalDate end);
}
