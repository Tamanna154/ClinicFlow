package com.Clinc_Flow.Clinic.config;

import com.Clinc_Flow.Clinic.user.User;
import com.Clinc_Flow.Clinic.user.UserRepository;
import com.Clinc_Flow.Clinic.doctor.Doctor;
import com.Clinc_Flow.Clinic.doctor.DoctorRepository;
import com.Clinc_Flow.Clinic.patient.Patient;
import com.Clinc_Flow.Clinic.patient.PatientRepository;
import com.Clinc_Flow.Clinic.doctor.availability.DoctorAvailabilityRepository;
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
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final DoctorAvailabilityRepository availabilityRepository;

    @Override
    public void run(String... args) {
        // Seed Admins
        seedIfMissing("Clinic Flow Admin", "clincflow@gmail.com", "clinic@flow", User.Role.CLINIC_ADMIN, "clincflow@gmail.com", "7383733435");
        seedIfMissing("Clinic Flow Admin Secondary", "clinicflow@gmail.com", "admin@clinicflow", User.Role.CLINIC_ADMIN, "clinicflow@gmail.com", "7383733435");
        seedIfMissing("Clinic Admin", "admin@gmail.com", "admin123", User.Role.CLINIC_ADMIN);
        seedIfMissing("Super Admin", "superadmin@gmail.com", "super123", User.Role.SUPER_ADMIN);
        seedIfMissing("Admin Doctor", "doctor@gmail.com", "doctor123", User.Role.DOCTOR);
        seedIfMissing("Receptionist", "receptionist@gmail.com", "reception123", User.Role.RECEPTIONIST);

        // Force update clincflow@gmail.com password to clinic@flow
        userRepository.findByUsername("clincflow@gmail.com").ifPresent(user -> {
            user.setPassword(passwordEncoder.encode("clinic@flow"));
            userRepository.save(user);
            log.info("Force updated admin password to clinic@flow");
        });

        // Seed Doctor: drtamanna@gmail.com / Dr@Tamanna
        String doctorEmail = "drtamanna@gmail.com";
        Doctor doctor = doctorRepository.findByEmail(doctorEmail)
                .orElseGet(() -> {
                    Doctor newDoc = Doctor.builder()
                            .name("Tamanna Oza")
                            .email(doctorEmail)
                            .phone("7383733436")
                            .specialization("General Medicine")
                            .qualifications("MBBS, MD")
                            .isActive(true)
                            .googleCalendarEnabled(false)
                            .build();
                    return doctorRepository.save(newDoc);
                });

        userRepository.findByUsername(doctorEmail).ifPresentOrElse(user -> {
            user.setPassword(passwordEncoder.encode("Dr@Tamanna"));
            user.setDoctorId(doctor.getId());
            userRepository.save(user);
        }, () -> {
            User doctorUser = User.builder()
                    .name("Tamanna Oza")
                    .username(doctorEmail)
                    .password(passwordEncoder.encode("Dr@Tamanna"))
                    .role(User.Role.DOCTOR)
                    .email(doctorEmail)
                    .phone("7383733436")
                    .doctorId(doctor.getId())
                    .build();
            userRepository.save(doctorUser);
            log.info("Created DOCTOR user: drtamanna@gmail.com / Dr@Tamanna linked to Doctor ID {}", doctor.getId());
        });

        // Seed default availability for doctor
        if (availabilityRepository.findByDoctorIdAndIsAvailableTrue(doctor.getId()).isEmpty()) {
            for (String day : java.util.List.of("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY")) {
                com.Clinc_Flow.Clinic.doctor.availability.DoctorAvailability availability = com.Clinc_Flow.Clinic.doctor.availability.DoctorAvailability.builder()
                        .doctor(doctor)
                        .dayOfWeek(day)
                        .startTime(java.time.LocalTime.of(9, 0))
                        .endTime(java.time.LocalTime.of(17, 0))
                        .slotDuration(30)
                        .isAvailable(true)
                        .build();
                availabilityRepository.save(availability);
            }
            log.info("Seeded default availability slots for Dr. Tamanna Oza");
        }

        // Seed Patient: padhyey@gmail.com / Pa@Dhyey
        String patientEmail = "padhyey@gmail.com";
        Patient patient = patientRepository.findByEmail(patientEmail)
                .orElseGet(() -> {
                    Patient newPat = Patient.builder()
                            .name("Dhyey")
                            .email(patientEmail)
                            .phone("9876543210")
                            .age(25)
                            .gender("Male")
                            .address("123 Health Street, Clinic City")
                            .bloodGroup("B+")
                            .archived(false)
                            .build();
                    return patientRepository.save(newPat);
                });

        userRepository.findByUsername(patientEmail).ifPresentOrElse(user -> {
            user.setPassword(passwordEncoder.encode("Pa@Dhyey"));
            user.setPatientId(patient.getId());
            userRepository.save(user);
        }, () -> {
            User patientUser = User.builder()
                    .name("Dhyey")
                    .username(patientEmail)
                    .password(passwordEncoder.encode("Pa@Dhyey"))
                    .role(User.Role.PATIENT)
                    .email(patientEmail)
                    .phone("9876543210")
                    .patientId(patient.getId())
                    .build();
            userRepository.save(patientUser);
            log.info("Created PATIENT user: padhyey@gmail.com / Pa@Dhyey linked to Patient ID {}", patient.getId());
        });

        // Seed Patient: clinicpatientclincflow@gmail.com / clinicpatient@2026
        String oldPatientEmail = "clinicpatientclincflow@gmail.com";
        Patient oldPatient = patientRepository.findByEmail(oldPatientEmail)
                .orElseGet(() -> {
                    Patient newPat = Patient.builder()
                            .name("Clinic Patient")
                            .email(oldPatientEmail)
                            .phone("9876543210")
                            .age(30)
                            .gender("Male")
                            .address("123 Health Street, Clinic City")
                            .bloodGroup("O+")
                            .medicalHistory("Hypertension")
                            .allergies("Dust")
                            .emergencyContactName("Emergency Contact")
                            .emergencyContactPhone("9876543211")
                            .archived(false)
                            .build();
                    return patientRepository.save(newPat);
                });

        userRepository.findByUsername(oldPatientEmail).ifPresentOrElse(user -> {
            user.setPassword(passwordEncoder.encode("clinicpatient@2026"));
            user.setPatientId(oldPatient.getId());
            userRepository.save(user);
        }, () -> {
            User patientUser = User.builder()
                    .name("Clinic Patient")
                    .username(oldPatientEmail)
                    .password(passwordEncoder.encode("clinicpatient@2026"))
                    .role(User.Role.PATIENT)
                    .email(oldPatientEmail)
                    .phone("9876543210")
                    .patientId(oldPatient.getId())
                    .build();
            userRepository.save(patientUser);
            log.info("Created PATIENT user: clinicpatientclincflow@gmail.com / clinicpatient@2026 linked to Patient ID {}", oldPatient.getId());
        });

        // Keep patientnameclincflow@gmail.com / patientname@2026 as fallback
        String fallbackPatientEmail = "patientnameclincflow@gmail.com";
        Patient fallbackPatient = patientRepository.findByEmail(fallbackPatientEmail)
                .orElseGet(() -> {
                    Patient newPat = Patient.builder()
                            .name("Clinic Patient Fallback")
                            .email(fallbackPatientEmail)
                            .phone("9876543212")
                            .age(30)
                            .gender("Male")
                            .address("123 Health Street, Clinic City")
                            .archived(false)
                            .build();
                    return patientRepository.save(newPat);
                });

        userRepository.findByUsername(fallbackPatientEmail).ifPresentOrElse(user -> {
            user.setPassword(passwordEncoder.encode("patientname@2026"));
            user.setPatientId(fallbackPatient.getId());
            userRepository.save(user);
        }, () -> {
            User patientUser = User.builder()
                    .name("Clinic Patient Fallback")
                    .username(fallbackPatientEmail)
                    .password(passwordEncoder.encode("patientname@2026"))
                    .role(User.Role.PATIENT)
                    .email(fallbackPatientEmail)
                    .phone("9876543212")
                    .patientId(fallbackPatient.getId())
                    .build();
            userRepository.save(patientUser);
            log.info("Created fallback PATIENT user: patientnameclincflow@gmail.com / patientname@2026 linked to Patient ID {}", fallbackPatient.getId());
        });
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
            userRepository.findByUsername(username).ifPresent(user -> {
                if (user.getPassword() != null && !user.getPassword().startsWith("$2")) {
                    user.setPassword(passwordEncoder.encode(password));
                    userRepository.save(user);
                    log.info("Encrypted plain text password for existing user: {}", username);
                }
            });
            log.debug("{} user already exists: {}", role, username);
        }
    }
}
