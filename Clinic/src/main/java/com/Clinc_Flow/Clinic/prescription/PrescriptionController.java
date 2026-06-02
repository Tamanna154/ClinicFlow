package com.Clinc_Flow.Clinic.prescription;

import com.Clinc_Flow.Clinic.config.JwtUserDetails;
import com.Clinc_Flow.Clinic.prescription.dto.PrescriptionRequest;
import com.Clinc_Flow.Clinic.prescription.dto.PrescriptionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @PostMapping("/consultation/{consultationId}")
    public ResponseEntity<PrescriptionResponse> create(
            @PathVariable Long consultationId,
            @RequestBody PrescriptionRequest request) {
        JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return ResponseEntity.ok(prescriptionService.create(consultationId, request, user.userId()));
    }

    @GetMapping("/consultation/{consultationId}")
    public ResponseEntity<PrescriptionResponse> getByConsultation(@PathVariable Long consultationId) {
        return ResponseEntity.ok(prescriptionService.getByConsultation(consultationId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PrescriptionResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(prescriptionService.getById(id));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<PrescriptionResponse>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(prescriptionService.getByPatient(patientId));
    }
}
