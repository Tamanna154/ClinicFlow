package com.Clinc_Flow.Clinic.salary;

import com.Clinc_Flow.Clinic.config.JwtUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/salary")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
public class SalaryPaymentController {

    private final SalaryPaymentService salaryPaymentService;

    @PostMapping("/pay")
    @PreAuthorize("hasAnyRole('CLINIC_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> paySalary(@Valid @RequestBody SalaryPaymentRequest request) {
        try {
            JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
            SalaryPaymentResponse response = salaryPaymentService.paySalary(request, user.userId());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'CLINIC_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<SalaryPaymentResponse>> getAllPayments() {
        JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        boolean isAdmin = "CLINIC_ADMIN".equals(user.role()) || "SUPER_ADMIN".equals(user.role());
        return ResponseEntity.ok(salaryPaymentService.getAllPayments(user.userId(), isAdmin));
    }

    @GetMapping("/staff/{staffId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'CLINIC_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<SalaryPaymentResponse>> getStaffPayments(@PathVariable Long staffId) {
        return ResponseEntity.ok(salaryPaymentService.getPaymentHistory(staffId));
    }
}
