package com.Clinc_Flow.Clinic.doctor.availability;

import com.Clinc_Flow.Clinic.doctor.availability.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/doctors/{doctorId}/availability")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@RequiredArgsConstructor
public class DoctorAvailabilityController {

    private final DoctorAvailabilityService availabilityService;

    @GetMapping
    public ResponseEntity<List<AvailabilityResponse>> getDoctorAvailability(@PathVariable Long doctorId) {
        return ResponseEntity.ok(availabilityService.getDoctorAvailability(doctorId));
    }

    @GetMapping("/available")
    public ResponseEntity<List<AvailabilityResponse>> getAvailableSlots(@PathVariable Long doctorId) {
        return ResponseEntity.ok(availabilityService.getDoctorAvailableSlots(doctorId));
    }

    @PostMapping
    public ResponseEntity<AvailabilityResponse> createAvailability(@Valid @RequestBody AvailabilityRequest request) {
        AvailabilityResponse response = availabilityService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AvailabilityResponse> updateAvailability(
            @PathVariable Long doctorId,
            @PathVariable Long id,
            @Valid @RequestBody AvailabilityRequest request) {
        return ResponseEntity.ok(availabilityService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAvailability(@PathVariable Long doctorId, @PathVariable Long id) {
        availabilityService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
