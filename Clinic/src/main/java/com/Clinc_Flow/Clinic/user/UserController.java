package com.Clinc_Flow.Clinic.user;

import com.Clinc_Flow.Clinic.config.JwtTokenProvider;
import com.Clinc_Flow.Clinic.config.JwtUserDetails;
import com.Clinc_Flow.Clinic.staff.DoctorStaffService;
import com.Clinc_Flow.Clinic.staff.Permission;
import com.Clinc_Flow.Clinic.user.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final DoctorStaffService doctorStaffService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            User user = userService.login(request.getUsername(), request.getPassword());
            String token = jwtTokenProvider.generateToken(
                    user.getId(), user.getUsername(), user.getRole().name());
            return ResponseEntity.ok(toAuthResponse(token, user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            User user = userService.register(
                    request.getName(),
                    request.getUsername(),
                    request.getPassword(),
                    User.Role.PATIENT,
                    request.getEmail(),
                    request.getPhone());
            String token = jwtTokenProvider.generateToken(
                    user.getId(), user.getUsername(), user.getRole().name());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(toAuthResponse(token, user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            String token = userService.forgotPassword(request.getEmail(), request.getPhone());
            return ResponseEntity.ok(Map.of(
                "message", "If an account exists with that information, a reset link has been sent.",
                "token", token
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            userService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Password reset successfully. You can now log in."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        try {
            JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            userService.changePassword(user.userId(), request.getOldPassword(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Password changed successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me/permissions")
    public ResponseEntity<List<String>> getMyPermissions() {
        JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if ("DOCTOR".equals(user.role())) {
            return ResponseEntity.ok(
                Arrays.stream(Permission.values())
                    .map(Enum::name)
                    .toList()
            );
        }

        if ("RECEPTIONIST".equals(user.role())) {
            return ResponseEntity.ok(doctorStaffService.getPermissionsForUser(user.userId()));
        }

        return ResponseEntity.ok(List.of());
    }

    private AuthResponse toAuthResponse(String token, User user) {
        List<String> permissions = List.of();
        String roleTitle = null;

        if (user.getRole() == User.Role.DOCTOR) {
            permissions = Arrays.stream(Permission.values())
                    .map(Enum::name)
                    .toList();
        } else if (user.getRole() == User.Role.RECEPTIONIST) {
            permissions = doctorStaffService.getPermissionsForUser(user.getId());
            roleTitle = doctorStaffService.getRoleTitleForUser(user.getId());
        } else if (user.getRole() == User.Role.CLINIC_ADMIN || user.getRole() == User.Role.SUPER_ADMIN) {
            permissions = Arrays.stream(Permission.values())
                    .map(Enum::name)
                    .toList();
            roleTitle = user.getRole() == User.Role.CLINIC_ADMIN ? "Clinic Admin" : "Super Admin";
        }

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .username(user.getUsername())
                .role(user.getRole().name())
                .doctorId(user.getDoctorId())
                .patientId(user.getPatientId())
                .email(user.getEmail())
                .phone(user.getPhone())
                .roleTitle(roleTitle)
                .permissions(permissions)
                .build();
    }
}
