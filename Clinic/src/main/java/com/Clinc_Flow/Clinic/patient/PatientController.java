package com.Clinc_Flow.Clinic.patient;

import com.Clinc_Flow.Clinic.patient.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS})
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @GetMapping
    public ResponseEntity<List<PatientResponse>> getAllPatients(
            @RequestParam(required = false) Boolean archived) {
        return ResponseEntity.ok(patientService.findAll(archived));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PatientResponse> getPatient(@PathVariable Long id) {
        return ResponseEntity.ok(patientService.findById(id));
    }

    @PostMapping
    public ResponseEntity<PatientResponse> createPatient(@Valid @RequestBody PatientRequest request) {
        PatientResponse response = patientService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PatientResponse> updatePatient(
            @PathVariable Long id,
            @Valid @RequestBody PatientRequest request) {
        return ResponseEntity.ok(patientService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePatient(@PathVariable Long id) {
        patientService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<PatientResponse> archivePatient(@PathVariable Long id) {
        return ResponseEntity.ok(patientService.archive(id));
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<PatientResponse> restorePatient(@PathVariable Long id) {
        return ResponseEntity.ok(patientService.restore(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<PatientResponse>> searchPatients(
            @RequestParam(value = "q", required = false) String query,
            @RequestParam(required = false) Boolean archived) {
        return ResponseEntity.ok(patientService.search(query, archived));
    }
}
