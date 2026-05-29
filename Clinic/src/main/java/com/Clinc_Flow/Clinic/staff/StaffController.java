package com.Clinc_Flow.Clinic.staff;

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
@RequestMapping("/api/staff")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
public class StaffController {

    private final DoctorStaffService doctorStaffService;

    @GetMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<StaffResponse>> getMyStaff() {
        JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(doctorStaffService.getMyStaff(user.userId()));
    }

    @PostMapping("/create-with-details")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> createStaffWithDetails(@Valid @RequestBody CreateStaffRequest request) {
        try {
            JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            StaffResponse response = doctorStaffService.createStaffWithDetails(user.userId(), request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> addStaff(@RequestBody Map<String, Long> body) {
        try {
            Long staffUserId = body.get("staffUserId");
            if (staffUserId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "staffUserId is required"));
            }
            JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            StaffResponse response = doctorStaffService.addStaff(user.userId(), staffUserId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{staffId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Void> removeStaff(@PathVariable Long staffId) {
        JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        doctorStaffService.removeStaff(user.userId(), staffId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{staffId}/permissions")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<String>> getStaffPermissions(@PathVariable Long staffId) {
        JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(doctorStaffService.getStaffPermissions(user.userId(), staffId));
    }

    @PutMapping("/{staffId}/permissions")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> updateStaffPermissions(
            @PathVariable Long staffId,
            @RequestBody Map<String, List<String>> body) {
        try {
            JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            List<String> permissions = body.get("permissions");
            if (permissions == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "permissions list is required"));
            }
            List<String> updated = doctorStaffService.updateStaffPermissions(user.userId(), staffId, permissions);
            return ResponseEntity.ok(Map.of("permissions", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/permissions-list")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<String>> getAllPermissions() {
        return ResponseEntity.ok(doctorStaffService.getAllPermissions());
    }
}
