package com.Clinc_Flow.Clinic.user;

import com.Clinc_Flow.Clinic.config.JwtTokenProvider;
import com.Clinc_Flow.Clinic.user.dto.AuthResponse;
import com.Clinc_Flow.Clinic.user.dto.LoginRequest;
import com.Clinc_Flow.Clinic.user.dto.RegisterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            User user = userService.login(request.getUsername(), request.getPassword());
            String token = jwtTokenProvider.generateToken(
                    user.getId(), user.getUsername(), user.getRole().name());
            return ResponseEntity.ok(toAuthResponse(token, user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            User user = userService.register(
                    request.getName(),
                    request.getUsername(),
                    request.getPassword(),
                    User.Role.PATIENT);
            // Create patientId from the patient record (linked by phone)
            String token = jwtTokenProvider.generateToken(
                    user.getId(), user.getUsername(), user.getRole().name());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(toAuthResponse(token, user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }

    private AuthResponse toAuthResponse(String token, User user) {
        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .username(user.getUsername())
                .role(user.getRole().name())
                .doctorId(user.getDoctorId())
                .patientId(user.getPatientId())
                .build();
    }
}
