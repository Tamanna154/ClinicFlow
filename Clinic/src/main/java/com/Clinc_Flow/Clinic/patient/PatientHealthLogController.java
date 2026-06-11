package com.Clinc_Flow.Clinic.patient;

import com.Clinc_Flow.Clinic.config.JwtUserDetails;
import com.Clinc_Flow.Clinic.user.User;
import com.Clinc_Flow.Clinic.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/patients/{patientId}/health-logs")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
public class PatientHealthLogController {

    private final PatientHealthLogRepository healthLogRepository;
    private final UserRepository userRepository;

    private void checkAccess(Long patientId) {
        JwtUserDetails userDetails = (JwtUserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        User u = userRepository.findById(userDetails.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Patients can only access their own health logs (Isolation concept)
        if (u.getRole() == User.Role.PATIENT) {
            if (u.getPatientId() == null || !u.getPatientId().equals(patientId)) {
                throw new SecurityException("Access Denied: You cannot access health logs of another patient.");
            }
        }
    }

    @GetMapping
    public ResponseEntity<List<PatientHealthLog>> getHealthLogs(@PathVariable Long patientId) {
        checkAccess(patientId);
        return ResponseEntity.ok(healthLogRepository.findByPatientIdOrderByMeasuredAtDesc(patientId));
    }

    @PostMapping
    public ResponseEntity<PatientHealthLog> addHealthLog(
            @PathVariable Long patientId,
            @RequestBody PatientHealthLog logEntry) {
        checkAccess(patientId);
        logEntry.setPatientId(patientId);
        return ResponseEntity.status(HttpStatus.CREATED).body(healthLogRepository.save(logEntry));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHealthLog(
            @PathVariable Long patientId,
            @PathVariable Long id) {
        checkAccess(patientId);
        PatientHealthLog logEntry = healthLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Health log not found"));
        if (!logEntry.getPatientId().equals(patientId)) {
            throw new IllegalArgumentException("Health log does not belong to this patient");
        }
        healthLogRepository.delete(logEntry);
        return ResponseEntity.noContent().build();
    }
}
