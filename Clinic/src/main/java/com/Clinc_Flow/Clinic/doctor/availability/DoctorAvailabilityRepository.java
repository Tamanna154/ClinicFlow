package com.Clinc_Flow.Clinic.doctor.availability;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, Long> {

    List<DoctorAvailability> findByDoctorIdOrderByDayOfWeek(Long doctorId);

    Optional<DoctorAvailability> findByDoctorIdAndDayOfWeek(Long doctorId, String dayOfWeek);

    List<DoctorAvailability> findByDoctorIdAndIsAvailableTrue(Long doctorId);
}
