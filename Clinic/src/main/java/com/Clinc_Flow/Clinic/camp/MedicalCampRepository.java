package com.Clinc_Flow.Clinic.camp;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MedicalCampRepository extends JpaRepository<MedicalCamp, Long> {
    List<MedicalCamp> findAllByOrderByCampDateAsc();
}
