package com.Clinc_Flow.Clinic.compensation;

import com.Clinc_Flow.Clinic.compensation.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/compensation/doctors")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.PUT, RequestMethod.POST, RequestMethod.OPTIONS})
@RequiredArgsConstructor
public class DoctorCompensationController {

    private final DoctorCompensationService compensationService;

    @GetMapping("/{doctorId}")
    public ResponseEntity<DoctorCompensationResponse> getCompensation(@PathVariable Long doctorId) {
        return ResponseEntity.ok(compensationService.getCompensation(doctorId));
    }

    @PutMapping("/{doctorId}")
    public ResponseEntity<DoctorCompensationResponse> createOrUpdateCompensation(
            @PathVariable Long doctorId,
            @RequestBody DoctorCompensationRequest request) {
        return ResponseEntity.ok(compensationService.createOrUpdate(doctorId, request));
    }

    @GetMapping("/{doctorId}/earnings")
    public ResponseEntity<DoctorEarningsSummaryResponse> getEarningsSummary(@PathVariable Long doctorId) {
        return ResponseEntity.ok(compensationService.getEarningsSummary(doctorId));
    }

    @GetMapping("/{doctorId}/payouts")
    public ResponseEntity<List<DoctorPayoutResponse>> getPayoutHistory(@PathVariable Long doctorId) {
        return ResponseEntity.ok(compensationService.getPayoutHistory(doctorId));
    }
}
