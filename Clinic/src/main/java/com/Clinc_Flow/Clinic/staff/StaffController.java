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
    @PreAuthorize("hasAnyRole('DOCTOR', 'CLINIC_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<StaffResponse>> getMyStaff() {
        JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        boolean isAdmin = "CLINIC_ADMIN".equals(user.role()) || "SUPER_ADMIN".equals(user.role());
        if (isAdmin) {
            return ResponseEntity.ok(doctorStaffService.getAllStaff());
        }
        return ResponseEntity.ok(doctorStaffService.getMyStaff(user.userId()));
    }

    @PostMapping("/create-with-details")
    @PreAuthorize("hasAnyRole('DOCTOR', 'CLINIC_ADMIN', 'SUPER_ADMIN')")
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
    @PreAuthorize("hasAnyRole('DOCTOR', 'CLINIC_ADMIN', 'SUPER_ADMIN')")
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

    @PutMapping("/{staffId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'CLINIC_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> updateStaff(
            @PathVariable Long staffId,
            @Valid @RequestBody CreateStaffRequest request) {
        try {
            JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            boolean isAdmin = "CLINIC_ADMIN".equals(user.role()) || "SUPER_ADMIN".equals(user.role());
            StaffResponse response = doctorStaffService.updateStaffWithDetails(user.userId(), staffId, request, isAdmin);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{staffId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'CLINIC_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> removeStaff(@PathVariable Long staffId) {
        JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        boolean isAdmin = "CLINIC_ADMIN".equals(user.role()) || "SUPER_ADMIN".equals(user.role());
        doctorStaffService.removeStaff(user.userId(), staffId, isAdmin);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{staffId}/permissions")
    @PreAuthorize("hasAnyRole('DOCTOR', 'CLINIC_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<String>> getStaffPermissions(@PathVariable Long staffId) {
        JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        boolean isAdmin = "CLINIC_ADMIN".equals(user.role()) || "SUPER_ADMIN".equals(user.role());
        return ResponseEntity.ok(doctorStaffService.getStaffPermissions(user.userId(), staffId, isAdmin));
    }

    @PutMapping("/{staffId}/permissions")
    @PreAuthorize("hasAnyRole('DOCTOR', 'CLINIC_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> updateStaffPermissions(
            @PathVariable Long staffId,
            @RequestBody Map<String, List<String>> body) {
        try {
            JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            boolean isAdmin = "CLINIC_ADMIN".equals(user.role()) || "SUPER_ADMIN".equals(user.role());
            List<String> permissions = body.get("permissions");
            if (permissions == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "permissions list is required"));
            }
            List<String> updated = doctorStaffService.updateStaffPermissions(user.userId(), staffId, permissions, isAdmin);
            return ResponseEntity.ok(Map.of("permissions", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/permissions-list")
    @PreAuthorize("hasAnyRole('DOCTOR', 'CLINIC_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<String>> getAllPermissions() {
        return ResponseEntity.ok(doctorStaffService.getAllPermissions());
    }
}
