package com.Clinc_Flow.Clinic.config;

import com.Clinc_Flow.Clinic.user.User;
import com.Clinc_Flow.Clinic.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminUserSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedIfMissing("Clinic Admin", "admin@gmail.com", "admin123", User.Role.CLINIC_ADMIN);
        seedIfMissing("Super Admin", "superadmin@gmail.com", "super123", User.Role.SUPER_ADMIN);
    }

    private void seedIfMissing(String name, String username, String password, User.Role role) {
        seedIfMissing(name, username, password, role, username, null);
    }

    private void seedIfMissing(String name, String username, String password, User.Role role, String email, String phone) {
        if (!userRepository.existsByUsername(username)) {
            User user = User.builder()
                    .name(name)
                    .username(username)
                    .password(passwordEncoder.encode(password))
                    .role(role)
                    .email(email)
                    .phone(phone)
                    .build();
            userRepository.save(user);
            log.info("Created {} user: {} / {} (email: {}, phone: {})", role, username, password, email, phone);
        } else {
            log.debug("{} user already exists: {}", role, username);
        }
    }
}
