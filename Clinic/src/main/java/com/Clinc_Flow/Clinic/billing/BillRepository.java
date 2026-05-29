package com.Clinc_Flow.Clinic.billing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {

    Optional<Bill> findByBillNumber(String billNumber);

    List<Bill> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    long countByPaymentStatus(String paymentStatus);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Bill b WHERE b.paymentStatus = 'PAID'")
    BigDecimal totalPaidRevenue();

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Bill b WHERE b.paymentStatus = 'PAID' AND b.createdAt >= :since")
    BigDecimal totalPaidRevenueSince(OffsetDateTime since);

    @Query("SELECT b FROM Bill b ORDER BY b.createdAt DESC")
    List<Bill> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Bill b WHERE b.paymentStatus = 'PAID' AND b.createdAt >= :start AND b.createdAt < :end")
    BigDecimal totalPaidRevenueBetween(OffsetDateTime start, OffsetDateTime end);
}
