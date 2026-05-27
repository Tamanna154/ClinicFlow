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
        return PatientResponse.fromEntity(patientRepository.save(patient));
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
