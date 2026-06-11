package com.Clinc_Flow.Clinic.user;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.Clinc_Flow.Clinic.doctor.DoctorRepository doctorRepository;
    private final com.Clinc_Flow.Clinic.patient.PatientRepository patientRepository;

    @Transactional
    public User login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid username or password");
        }
        if (user.getRole() == User.Role.DOCTOR && user.getDoctorId() == null) {
            String emailToSearch = user.getEmail() != null ? user.getEmail() : username;
            doctorRepository.findByEmail(emailToSearch).ifPresent(d -> {
                user.setDoctorId(d.getId());
                userRepository.save(user);
                log.info("Auto-linked doctor user {} to doctor profile ID {}", user.getUsername(), d.getId());
            });
        }
        if (user.getRole() == User.Role.PATIENT && user.getPatientId() == null) {
            String emailToSearch = user.getEmail() != null ? user.getEmail() : username;
            com.Clinc_Flow.Clinic.patient.Patient patient = null;
            if (emailToSearch != null && !emailToSearch.isBlank()) {
                patient = patientRepository.findByEmail(emailToSearch).orElse(null);
            }
            if (patient == null) {
                patient = com.Clinc_Flow.Clinic.patient.Patient.builder()
                        .name(user.getName())
                        .email(user.getEmail())
                        .phone(user.getPhone() != null ? user.getPhone() : "")
                        .archived(false)
                        .build();
                patient = patientRepository.save(patient);
            }
            user.setPatientId(patient.getId());
            userRepository.save(user);
            log.info("Auto-linked patient user {} to patient profile ID {}", user.getUsername(), patient.getId());
        }
        return user;
    }

    @Transactional(readOnly = true)
    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @Transactional
    public User register(String name, String username, String password, User.Role role) {
        return register(name, username, password, role, null, null);
    }

    @Transactional
    public User register(String name, String username, String password, User.Role role, String email, String phone) {
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already taken");
        }
        
        Long patientId = null;
        if (role == User.Role.PATIENT) {
            com.Clinc_Flow.Clinic.patient.Patient patient = null;
            if (email != null && !email.isBlank()) {
                patient = patientRepository.findByEmail(email).orElse(null);
            }
            if (patient == null) {
                patient = com.Clinc_Flow.Clinic.patient.Patient.builder()
                        .name(name)
                        .email(email)
                        .phone(phone != null ? phone : "")
                        .archived(false)
                        .build();
                patient = patientRepository.save(patient);
            }
            patientId = patient.getId();
        }

        User user = User.builder()
                .name(name)
                .username(username)
                .password(passwordEncoder.encode(password))
                .role(role)
                .email(email)
                .phone(phone)
                .patientId(patientId)
                .build();
        return userRepository.save(user);
    }

    @Transactional
    public String forgotPassword(String email, String phone) {
        if ((email == null || email.isBlank()) && (phone == null || phone.isBlank())) {
            throw new IllegalArgumentException("Email or phone is required");
        }

        User user = null;
        if (email != null && !email.isBlank()) {
            user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("No account found with that email"));
        } else if (phone != null && !phone.isBlank()) {
            user = userRepository.findByPhone(phone)
                    .orElseThrow(() -> new IllegalArgumentException("No account found with that phone number"));
        }

        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(user);

        String maskedEmail = user.getEmail() != null
                ? user.getEmail().replaceAll("(?<=.).(?=.*@)", "*")
                : "not provided";
        String maskedPhone = user.getPhone() != null
                ? "***" + user.getPhone().substring(Math.max(0, user.getPhone().length() - 4))
                : "not provided";

        log.info("Password reset token for {} (email: {}, phone: {}): {}", user.getUsername(), maskedEmail, maskedPhone, token);

        return token;
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }

        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            user.setResetToken(null);
            user.setResetTokenExpiry(null);
            userRepository.save(user);
            throw new IllegalArgumentException("Reset token has expired. Please request a new one.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    @Transactional
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
