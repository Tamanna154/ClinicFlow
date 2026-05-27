package com.Clinc_Flow.Clinic.doctor.availability;

import com.Clinc_Flow.Clinic.doctor.Doctor;
import com.Clinc_Flow.Clinic.doctor.DoctorRepository;
import com.Clinc_Flow.Clinic.doctor.availability.dto.*;
import com.Clinc_Flow.Clinic.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorAvailabilityService {

    private final DoctorAvailabilityRepository availabilityRepository;
    private final DoctorRepository doctorRepository;

    @Transactional(readOnly = true)
    public List<AvailabilityResponse> getDoctorAvailability(Long doctorId) {
        return availabilityRepository.findByDoctorIdOrderByDayOfWeek(doctorId).stream()
                .map(AvailabilityResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AvailabilityResponse> getDoctorAvailableSlots(Long doctorId) {
        return availabilityRepository.findByDoctorIdAndIsAvailableTrue(doctorId).stream()
                .map(AvailabilityResponse::fromEntity)
                .toList();
    }

    @Transactional
    public AvailabilityResponse create(AvailabilityRequest request) {
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", request.getDoctorId()));

        if (availabilityRepository.findByDoctorIdAndDayOfWeek(request.getDoctorId(), request.getDayOfWeek()).isPresent()) {
            throw new IllegalArgumentException("Availability already exists for " + request.getDayOfWeek());
        }

        if (request.getEndTime() != null && request.getStartTime() != null
                && !request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time");
        }

        DoctorAvailability availability = DoctorAvailability.builder()
                .doctor(doctor)
                .dayOfWeek(request.getDayOfWeek())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .slotDuration(request.getSlotDuration() != null ? request.getSlotDuration() : 30)
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true)
                .build();

        return AvailabilityResponse.fromEntity(availabilityRepository.save(availability));
    }

    @Transactional
    public AvailabilityResponse update(Long id, AvailabilityRequest request) {
        DoctorAvailability availability = availabilityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DoctorAvailability", id));

        if (request.getEndTime() != null && request.getStartTime() != null
                && !request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time");
        }

        availability.setDayOfWeek(request.getDayOfWeek());
        availability.setStartTime(request.getStartTime());
        availability.setEndTime(request.getEndTime());
        if (request.getSlotDuration() != null) availability.setSlotDuration(request.getSlotDuration());
        if (request.getIsAvailable() != null) availability.setIsAvailable(request.getIsAvailable());

        return AvailabilityResponse.fromEntity(availabilityRepository.save(availability));
    }

    @Transactional
    public void delete(Long id) {
        if (!availabilityRepository.existsById(id)) {
            throw new ResourceNotFoundException("DoctorAvailability", id);
        }
        availabilityRepository.deleteById(id);
    }
}
