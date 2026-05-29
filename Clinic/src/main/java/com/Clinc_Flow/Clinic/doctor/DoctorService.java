package com.Clinc_Flow.Clinic.doctor;

import com.Clinc_Flow.Clinic.doctor.dto.*;
import com.Clinc_Flow.Clinic.exception.ResourceNotFoundException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;

    @Transactional(readOnly = true)
    public List<DoctorResponse> findAll() {
        return doctorRepository.findAll().stream()
                .map(DoctorResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DoctorResponse> findAllActive() {
        return doctorRepository.findByIsActiveTrue().stream()
                .map(DoctorResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public DoctorResponse findById(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", id));
        return DoctorResponse.fromEntity(doctor);
    }

    @Transactional
    public DoctorResponse create(DoctorRequest request) {
        if (doctorRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("A doctor with email " + request.getEmail() + " already exists");
        }
        Doctor doctor = Doctor.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .specialization(request.getSpecialization())
                .qualifications(request.getQualifications())
                .bio(request.getBio())
                .consultationFee(request.getConsultationFee())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .googleCalendarEnabled(request.getGoogleCalendarEnabled() != null ? request.getGoogleCalendarEnabled() : false)
                .achievements(toAchievementsJson(request.getAchievements()))
                .build();
        return DoctorResponse.fromEntity(doctorRepository.save(doctor));
    }

    @Transactional
    public DoctorResponse update(Long id, DoctorRequest request) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", id));
        if (!doctor.getEmail().equals(request.getEmail()) && doctorRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("A doctor with email " + request.getEmail() + " already exists");
        }
        doctor.setName(request.getName());
        doctor.setEmail(request.getEmail());
        doctor.setPhone(request.getPhone());
        doctor.setSpecialization(request.getSpecialization());
        doctor.setQualifications(request.getQualifications());
        doctor.setBio(request.getBio());
        doctor.setConsultationFee(request.getConsultationFee());
        doctor.setIsActive(request.getIsActive() != null ? request.getIsActive() : doctor.getIsActive());
        doctor.setGoogleCalendarEnabled(request.getGoogleCalendarEnabled() != null ? request.getGoogleCalendarEnabled() : doctor.getGoogleCalendarEnabled());
        doctor.setAchievements(toAchievementsJson(request.getAchievements()));
        return DoctorResponse.fromEntity(doctorRepository.save(doctor));
    }

    @Transactional
    public void delete(Long id) {
        if (!doctorRepository.existsById(id)) {
            throw new ResourceNotFoundException("Doctor", id);
        }
        doctorRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<DoctorResponse> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return findAll();
        }
        String trimmed = query.trim();
        List<Doctor> doctors = doctorRepository.findByNameContainingIgnoreCase(trimmed);
        if (doctors.isEmpty()) {
            doctors = doctorRepository.findBySpecializationContainingIgnoreCase(trimmed);
        }
        return doctors.stream()
                .map(DoctorResponse::fromEntity)
                .toList();
    }

    private String toAchievementsJson(List<AchievementDto> achievements) {
        if (achievements == null) return "[]";
        try {
            return new ObjectMapper().writeValueAsString(achievements);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }
}
