package com.Clinc_Flow.Clinic.patient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    List<Patient> findByNameContainingIgnoreCase(String name);

    List<Patient> findByPhoneContaining(String phone);

    List<Patient> findByArchived(Boolean archived);

    List<Patient> findByArchivedFalse();

    List<Patient> findByNameContainingIgnoreCaseAndArchived(String name, Boolean archived);

    List<Patient> findByPhoneContainingAndArchived(String phone, Boolean archived);

    List<Patient> findByAssignedDoctorId(Long doctorId);

    List<Patient> findByAssignedDoctorIdIsNull();

    long countByArchivedFalse();

    long countByCreatedAtBetween(OffsetDateTime start, OffsetDateTime end);

    @Query("SELECT COUNT(p) FROM Patient p WHERE p.createdAt >= :start")
    long countByCreatedAtAfter(@Param("start") OffsetDateTime start);

    @Query(value = "SELECT DATE(p.created_at) as date, COUNT(*) FROM patients p WHERE p.created_at >= :start GROUP BY DATE(p.created_at) ORDER BY date", nativeQuery = true)
    List<Object[]> countByDateGroupedNative(@Param("start") OffsetDateTime start);

    @Query(value = "SELECT TO_CHAR(p.created_at, 'YYYY-MM') as month, COUNT(*) FROM patients p WHERE p.created_at >= :start GROUP BY TO_CHAR(p.created_at, 'YYYY-MM') ORDER BY month", nativeQuery = true)
    List<Object[]> countByMonthGroupedNative(@Param("start") OffsetDateTime start);
}
