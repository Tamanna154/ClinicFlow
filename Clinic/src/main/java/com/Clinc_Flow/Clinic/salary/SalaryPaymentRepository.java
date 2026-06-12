package com.Clinc_Flow.Clinic.salary;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SalaryPaymentRepository extends JpaRepository<SalaryPayment, Long> {
    List<SalaryPayment> findByStaffIdOrderByPaymentDateDesc(Long staffId);
    List<SalaryPayment> findAllByOrderByPaymentDateDesc();
}
