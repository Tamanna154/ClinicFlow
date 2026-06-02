package com.Clinc_Flow.Clinic.doctor.letterhead;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LetterheadRepository extends JpaRepository<Letterhead, Long> {
    Optional<Letterhead> findByDoctorId(Long doctorId);
}
