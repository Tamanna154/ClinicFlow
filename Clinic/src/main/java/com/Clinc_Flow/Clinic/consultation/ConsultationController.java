package com.Clinc_Flow.Clinic.consultation;

import com.Clinc_Flow.Clinic.config.JwtUserDetails;
import com.Clinc_Flow.Clinic.consultation.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/consultations")
@CrossOrigin(origins = "*", allowedHeaders = "*",
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS})
@RequiredArgsConstructor
public class ConsultationController {

    private final ConsultationService consultationService;

    @PostMapping("/appointment/{appointmentId}/start")
    @PreAuthorize("hasAnyRole('DOCTOR')")
    public ResponseEntity<ConsultationResponse> startConsultation(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(consultationService.startConsultation(appointmentId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR')")
    public ResponseEntity<ConsultationResponse> updateConsultation(
            @PathVariable Long id,
            @Valid @RequestBody ConsultationRequest request) {
        return ResponseEntity.ok(consultationService.updateConsultation(id, request));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('DOCTOR')")
    public ResponseEntity<ConsultationResponse> completeConsultation(@PathVariable Long id) {
        return ResponseEntity.ok(consultationService.completeConsultation(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConsultationResponse> getConsultation(@PathVariable Long id) {
        return ResponseEntity.ok(consultationService.getConsultation(id));
    }

    @GetMapping("/by-appointment/{appointmentId}")
    public ResponseEntity<ConsultationResponse> getByAppointment(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(consultationService.getConsultationByAppointment(appointmentId));
    }

    @GetMapping("/patient/{patientId}/history")
    public ResponseEntity<List<ConsultationResponse>> getPatientHistory(@PathVariable Long patientId) {
        return ResponseEntity.ok(consultationService.getPatientHistory(patientId));
    }

    @PostMapping("/{id}/bill")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST')")
    public ResponseEntity<ConsultationBillResponse> generateBill(
            @PathVariable Long id,
            @Valid @RequestBody ConsultationBillRequest request) {
        JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(consultationService.generateBill(id, request, user.userId()));
    }

    @PostMapping("/{id}/payment")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST')")
    public ResponseEntity<ConsultationBillResponse> recordPayment(
            @PathVariable Long id,
            @RequestBody ConsultationBillRequest request) {
        JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return ResponseEntity.ok(consultationService.recordPayment(id,
                request.getPaymentStatus(), request.getPaymentMethod(), user.userId()));
    }

    @GetMapping("/{id}/bill")
    public ResponseEntity<ConsultationBillResponse> getBill(@PathVariable Long id) {
        return ResponseEntity.ok(consultationService.getBill(id));
    }

    @GetMapping("/dashboard/doctor")
    @PreAuthorize("hasAnyRole('DOCTOR')")
    public ResponseEntity<DoctorDashboardResponse> getDoctorDashboard() {
        JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return ResponseEntity.ok(consultationService.getDoctorDashboard(user.userId()));
    }
}
