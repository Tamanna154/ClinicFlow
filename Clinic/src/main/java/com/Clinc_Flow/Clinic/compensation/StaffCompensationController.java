package com.Clinc_Flow.Clinic.compensation;

import com.Clinc_Flow.Clinic.compensation.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/compensation/staff")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.PUT, RequestMethod.POST, RequestMethod.OPTIONS})
@RequiredArgsConstructor
public class StaffCompensationController {

    private final StaffCompensationService staffCompensationService;

    @GetMapping("/{staffId}")
    public ResponseEntity<StaffCompensationResponse> getCompensation(@PathVariable Long staffId) {
        return ResponseEntity.ok(staffCompensationService.getCompensation(staffId));
    }

    @PutMapping("/{staffId}")
    public ResponseEntity<StaffCompensationResponse> createOrUpdateCompensation(
            @PathVariable Long staffId,
            @RequestBody StaffCompensationRequest request) {
        return ResponseEntity.ok(staffCompensationService.createOrUpdate(staffId, request));
    }
}
