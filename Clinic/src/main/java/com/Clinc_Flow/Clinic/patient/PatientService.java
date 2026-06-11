package com.Clinc_Flow.Clinic.patient;

import com.Clinc_Flow.Clinic.exception.ResourceNotFoundException;
import com.Clinc_Flow.Clinic.patient.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final com.Clinc_Flow.Clinic.user.UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final com.Clinc_Flow.Clinic.notification.NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<PatientResponse> findAll(Boolean archived) {
        if (archived != null) {
            return patientRepository.findByArchived(archived).stream()
                    .map(PatientResponse::fromEntity)
                    .toList();
        }
        return patientRepository.findByArchivedFalse().stream()
                .map(PatientResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public PatientResponse findById(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", id));
        return PatientResponse.fromEntity(patient);
    }

    @Transactional
    public PatientResponse create(PatientRequest request) {
        Patient patient = Patient.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .age(request.getAge())
                .gender(request.getGender())
                .address(request.getAddress())
                .bloodGroup(request.getBloodGroup())
                .medicalHistory(request.getMedicalHistory())
                .allergies(request.getAllergies())
                .emergencyContactName(request.getEmergencyContactName())
                .emergencyContactPhone(request.getEmergencyContactPhone())
                .archived(false)
                .assignedDoctorId(request.getAssignedDoctorId())
                .createdByType(request.getCreatedByType())
                .createdById(request.getCreatedById())
                .createdByName(request.getCreatedByName())
                .build();
        patient = patientRepository.save(patient);

        String firstName = "patient";
        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            String[] parts = request.getName().trim().split("\\s+");
            if (parts.length > 0) {
                firstName = parts[0];
            }
        }
        String cleanFirstName = firstName.toLowerCase().replaceAll("[^a-z0-9]", "");
        if (cleanFirstName.isEmpty()) cleanFirstName = "patient";

        String tempUsername = "";
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            tempUsername = request.getEmail().trim();
            if (userRepository.existsByUsername(tempUsername)) {
                throw new IllegalArgumentException("A user with username " + tempUsername + " already exists");
            }
        } else {
            String baseUsername = "pa" + cleanFirstName + "@gmail.com";
            String generatedUsername = baseUsername;
            int suffix = 1;
            while (userRepository.existsByUsername(generatedUsername)) {
                generatedUsername = "pa" + cleanFirstName + suffix + "@gmail.com";
                suffix++;
            }
            tempUsername = generatedUsername;
        }

        String capitalizedFirstName = cleanFirstName.substring(0, 1).toUpperCase() + cleanFirstName.substring(1);
        String password = "Pa@" + capitalizedFirstName;

        com.Clinc_Flow.Clinic.user.User user = com.Clinc_Flow.Clinic.user.User.builder()
                .name(patient.getName())
                .username(tempUsername)
                .password(passwordEncoder.encode(password))
                .role(com.Clinc_Flow.Clinic.user.User.Role.PATIENT)
                .email(patient.getEmail())
                .phone(patient.getPhone())
                .patientId(patient.getId())
                .build();
        userRepository.save(user);

        // Send SMS to Patient
        if (patient.getPhone() != null && !patient.getPhone().trim().isEmpty()) {
            try {
                String smsMsg = "Welcome to ClinicFlow! Your patient portal account has been created.\nUsername: " + tempUsername + "\nPassword: " + password;
                notificationService.sendSms(patient.getPhone(), smsMsg);
            } catch (Exception e) {
                // Ignore
            }
        }

        // Send SMS to Admin (7383733435)
        try {
            String adminMsg = "Admin Alert: Patient " + patient.getName() + " created.\nUsername: " + tempUsername + "\nPassword: " + password;
            notificationService.sendSms("7383733435", adminMsg);
        } catch (Exception e) {
            // Ignore
        }

        PatientResponse response = PatientResponse.fromEntity(patient);
        response.setTempUsername(tempUsername);
        response.setTempPassword(password);
        return response;
    }

    @Transactional
    public PatientResponse update(Long id, PatientRequest request) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", id));
        patient.setName(request.getName());
        patient.setPhone(request.getPhone());
        patient.setEmail(request.getEmail());
        patient.setAge(request.getAge());
        patient.setGender(request.getGender());
        patient.setAddress(request.getAddress());
        patient.setBloodGroup(request.getBloodGroup());
        patient.setMedicalHistory(request.getMedicalHistory());
        patient.setAllergies(request.getAllergies());
        patient.setEmergencyContactName(request.getEmergencyContactName());
        patient.setEmergencyContactPhone(request.getEmergencyContactPhone());
        patient.setAssignedDoctorId(request.getAssignedDoctorId());
        return PatientResponse.fromEntity(patientRepository.save(patient));
    }

    @Transactional
    public void delete(Long id) {
        if (!patientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Patient", id);
        }
        patientRepository.deleteById(id);
    }

    @Transactional
    public PatientResponse archive(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", id));
        patient.setArchived(true);
        return PatientResponse.fromEntity(patientRepository.save(patient));
    }

    @Transactional
    public PatientResponse restore(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", id));
        patient.setArchived(false);
        return PatientResponse.fromEntity(patientRepository.save(patient));
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> findAllByAssignedDoctor(Long doctorId) {
        return patientRepository.findByAssignedDoctorId(doctorId).stream()
                .map(PatientResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> findAllUnassigned() {
        return patientRepository.findByAssignedDoctorIdIsNull().stream()
                .map(PatientResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> search(String query, Boolean archived) {
        if (query == null || query.trim().isEmpty()) {
            return findAll(archived);
        }
        String trimmed = query.trim();
        List<Patient> patients;
        if (archived != null) {
            patients = patientRepository.findByNameContainingIgnoreCaseAndArchived(trimmed, archived);
            if (patients.isEmpty()) {
                patients = patientRepository.findByPhoneContainingAndArchived(trimmed, archived);
            }
        } else {
            patients = patientRepository.findByNameContainingIgnoreCaseAndArchived(trimmed, false);
            if (patients.isEmpty()) {
                patients = patientRepository.findByPhoneContainingAndArchived(trimmed, false);
            }
        }
        return patients.stream()
                .map(PatientResponse::fromEntity)
                .toList();
    }
}
