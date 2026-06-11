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
@RequestMapping("/api/patients/{patientId}/family")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
public class PatientFamilyMemberController {

    private final PatientFamilyMemberRepository familyMemberRepository;
    private final UserRepository userRepository;

    private void checkAccess(Long patientId) {
        JwtUserDetails userDetails = (JwtUserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        User u = userRepository.findById(userDetails.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Patients can only access their own family members (Isolation concept)
        if (u.getRole() == User.Role.PATIENT) {
            if (u.getPatientId() == null || !u.getPatientId().equals(patientId)) {
                throw new SecurityException("Access Denied: You cannot access details of another patient.");
            }
        }
    }

    @GetMapping
    public ResponseEntity<List<PatientFamilyMember>> getFamilyMembers(@PathVariable Long patientId) {
        checkAccess(patientId);
        return ResponseEntity.ok(familyMemberRepository.findByPatientId(patientId));
    }

    @PostMapping
    public ResponseEntity<PatientFamilyMember> addFamilyMember(
            @PathVariable Long patientId,
            @RequestBody PatientFamilyMember member) {
        checkAccess(patientId);
        member.setPatientId(patientId);
        return ResponseEntity.status(HttpStatus.CREATED).body(familyMemberRepository.save(member));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFamilyMember(
            @PathVariable Long patientId,
            @PathVariable Long id) {
        checkAccess(patientId);
        PatientFamilyMember member = familyMemberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Family member not found"));
        if (!member.getPatientId().equals(patientId)) {
            throw new IllegalArgumentException("Family member does not belong to this patient");
        }
        familyMemberRepository.delete(member);
        return ResponseEntity.noContent().build();
    }
}
