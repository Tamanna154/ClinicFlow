package com.Clinc_Flow.Clinic.doctor.letterhead;

import com.Clinc_Flow.Clinic.config.JwtUserDetails;
import com.Clinc_Flow.Clinic.doctor.letterhead.dto.LetterheadRequest;
import com.Clinc_Flow.Clinic.doctor.letterhead.dto.LetterheadResponse;
import com.Clinc_Flow.Clinic.user.User;
import com.Clinc_Flow.Clinic.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/doctors/{doctorId}/letterhead")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class LetterheadController {

    private final LetterheadService letterheadService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR')")
    public ResponseEntity<LetterheadResponse> getLetterhead(
            @PathVariable Long doctorId,
            HttpServletRequest request) {
        return ResponseEntity.ok(letterheadService.getLetterhead(doctorId, request));
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('DOCTOR')")
    public ResponseEntity<LetterheadResponse> saveLetterhead(
            @PathVariable Long doctorId,
            @Valid @RequestBody LetterheadRequest req,
            HttpServletRequest request) {
        JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        User currentUser = userRepository.findById(user.userId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!currentUser.getDoctorId().equals(doctorId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(letterheadService.saveLetterhead(doctorId, req, request));
    }

    @PostMapping("/upload/{field}")
    @PreAuthorize("hasAnyRole('DOCTOR')")
    public ResponseEntity<LetterheadResponse> uploadImage(
            @PathVariable Long doctorId,
            @PathVariable String field,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {
        JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        User currentUser = userRepository.findById(user.userId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!currentUser.getDoctorId().equals(doctorId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(letterheadService.uploadImage(doctorId, field, file, request));
    }
}
