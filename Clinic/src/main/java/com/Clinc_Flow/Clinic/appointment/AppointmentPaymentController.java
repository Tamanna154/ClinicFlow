package com.Clinc_Flow.Clinic.appointment;

import com.Clinc_Flow.Clinic.appointment.dto.AppointmentPaymentRequest;
import com.Clinc_Flow.Clinic.appointment.dto.AppointmentResponse;
import com.Clinc_Flow.Clinic.config.JwtUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*", allowedHeaders = "*",
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS})
@RequiredArgsConstructor
public class AppointmentPaymentController {

    private final AppointmentPaymentService appointmentPaymentService;

    @PostMapping("/{id}/payment")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST')")
    public ResponseEntity<AppointmentResponse> recordPayment(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentPaymentRequest request) {
        JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return ResponseEntity.ok(appointmentPaymentService.recordPayment(id, request, user.userId()));
    }

    @GetMapping("/revenue")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST')")
    public ResponseEntity<Object> getRevenueSummary() {
        return ResponseEntity.ok(appointmentPaymentService.getRevenueSummary());
    }
}
