package com.Clinc_Flow.Clinic.consultation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ConsultationBillRepository extends JpaRepository<ConsultationBill, Long> {

    Optional<ConsultationBill> findByConsultationId(Long consultationId);
}
