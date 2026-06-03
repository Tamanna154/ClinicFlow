package com.Clinc_Flow.Clinic.doctor;

import com.Clinc_Flow.Clinic.clinic.Clinic;
import com.Clinc_Flow.Clinic.clinic.ClinicRepository;
import com.Clinc_Flow.Clinic.doctor.dto.*;
import com.Clinc_Flow.Clinic.exception.ResourceNotFoundException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.Clinc_Flow.Clinic.doctor.availability.DoctorAvailability;
import com.Clinc_Flow.Clinic.doctor.availability.DoctorAvailabilityRepository;

import org.springframework.security.crypto.password.PasswordEncoder;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final ClinicRepository clinicRepository;
    private final com.Clinc_Flow.Clinic.user.UserRepository userRepository;
    private final DoctorAvailabilityRepository availabilityRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<DoctorResponse> findAll() {
        List<Doctor> doctors = doctorRepository.findAll();
        return enrichWithClinicNames(doctors);
    }

    @Transactional(readOnly = true)
    public List<DoctorResponse> findAllActive() {
        List<Doctor> doctors = doctorRepository.findByIsActiveTrue();
        return enrichWithClinicNames(doctors);
    }

    @Transactional(readOnly = true)
    public DoctorResponse findById(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", id));
        DoctorResponse response = DoctorResponse.fromEntity(doctor);
        if (doctor.getClinicId() != null) {
            clinicRepository.findById(doctor.getClinicId())
                    .ifPresent(clinic -> response.setClinicName(clinic.getName()));
        }
        return response;
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
                .address(request.getAddress())
                .specialization(request.getSpecialization())
                .qualifications(request.getQualifications())
                .bio(request.getBio())
                .consultationFee(request.getConsultationFee())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .googleCalendarEnabled(request.getGoogleCalendarEnabled() != null ? request.getGoogleCalendarEnabled() : false)
                .achievements(toAchievementsJson(request.getAchievements()))
                .clinicId(request.getClinicId())
                .build();
        Doctor savedDoctor = doctorRepository.save(doctor);

        // Seed default or customized availability
        List<String> days = request.getAvailabilityDays();
        if (days == null || days.isEmpty()) {
            days = List.of("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY");
        }
        java.time.LocalTime start = request.getAvailabilityStartTime() != null 
                ? java.time.LocalTime.parse(request.getAvailabilityStartTime()) 
                : java.time.LocalTime.of(9, 0);
        java.time.LocalTime end = request.getAvailabilityEndTime() != null 
                ? java.time.LocalTime.parse(request.getAvailabilityEndTime()) 
                : java.time.LocalTime.of(17, 0);
        int duration = request.getSlotDuration() != null ? request.getSlotDuration() : 30;

        for (String day : days) {
            DoctorAvailability availability = DoctorAvailability.builder()
                    .doctor(savedDoctor)
                    .dayOfWeek(day.toUpperCase())
                    .startTime(start)
                    .endTime(end)
                    .slotDuration(duration)
                    .isAvailable(true)
                    .build();
            availabilityRepository.save(availability);
        }

        // Auto-create matching User account if it doesn't exist
        if (!userRepository.existsByUsername(request.getEmail())) {
            String defaultPassword = "password123";
            com.Clinc_Flow.Clinic.user.User userObj = com.Clinc_Flow.Clinic.user.User.builder()
                    .name(request.getName())
                    .username(request.getEmail())
                    .password(passwordEncoder.encode(defaultPassword))
                    .role(com.Clinc_Flow.Clinic.user.User.Role.DOCTOR)
                    .email(request.getEmail())
                    .phone(request.getPhone())
                    .doctorId(savedDoctor.getId())
                    .build();
            userRepository.save(userObj);
        } else {
            userRepository.findByUsername(request.getEmail()).ifPresent(u -> {
                if (u.getRole() == com.Clinc_Flow.Clinic.user.User.Role.DOCTOR) {
                    u.setDoctorId(savedDoctor.getId());
                    userRepository.save(u);
                }
            });
        }
        return DoctorResponse.fromEntity(savedDoctor);
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
        doctor.setAddress(request.getAddress());
        doctor.setSpecialization(request.getSpecialization());
        doctor.setQualifications(request.getQualifications());
        doctor.setBio(request.getBio());
        doctor.setConsultationFee(request.getConsultationFee());
        doctor.setIsActive(request.getIsActive() != null ? request.getIsActive() : doctor.getIsActive());
        doctor.setGoogleCalendarEnabled(request.getGoogleCalendarEnabled() != null ? request.getGoogleCalendarEnabled() : doctor.getGoogleCalendarEnabled());
        doctor.setAchievements(toAchievementsJson(request.getAchievements()));
        doctor.setClinicId(request.getClinicId());
        Doctor savedDoctor = doctorRepository.save(doctor);
        userRepository.findByUsername(request.getEmail()).ifPresent(u -> {
            if (u.getRole() == com.Clinc_Flow.Clinic.user.User.Role.DOCTOR) {
                u.setDoctorId(savedDoctor.getId());
                userRepository.save(u);
            }
        });
        return DoctorResponse.fromEntity(savedDoctor);
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
        return enrichWithClinicNames(doctors);
    }

    private List<DoctorResponse> enrichWithClinicNames(List<Doctor> doctors) {
        if (doctors.isEmpty()) return List.of();
        List<Long> clinicIds = doctors.stream()
                .map(Doctor::getClinicId)
                .filter(id -> id != null)
                .distinct()
                .toList();
        Map<Long, String> clinicNames = clinicRepository.findAllById(clinicIds).stream()
                .collect(Collectors.toMap(Clinic::getId, Clinic::getName));
        return doctors.stream().map(d -> {
            DoctorResponse resp = DoctorResponse.fromEntity(d);
            if (d.getClinicId() != null) {
                resp.setClinicName(clinicNames.get(d.getClinicId()));
            }
            return resp;
        }).toList();
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
