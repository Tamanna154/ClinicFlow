package com.Clinc_Flow.Clinic.clinic;

import com.Clinc_Flow.Clinic.clinic.dto.*;
import com.Clinc_Flow.Clinic.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClinicService {

    private final ClinicRepository clinicRepository;

    @Transactional(readOnly = true)
    public List<ClinicResponse> findAll() {
        return clinicRepository.findAll().stream()
                .map(ClinicResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClinicResponse findById(Long id) {
        Clinic clinic = clinicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Clinic", id));
        return ClinicResponse.fromEntity(clinic);
    }

    @Transactional
    public ClinicResponse create(ClinicRequest request) {
        if (clinicRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("A clinic with name " + request.getName() + " already exists");
        }
        Clinic clinic = Clinic.builder()
                .name(request.getName())
                .address(request.getAddress())
                .phone(request.getPhone())
                .email(request.getEmail())
                .logoPath(request.getLogoPath())
                .build();
        return ClinicResponse.fromEntity(clinicRepository.save(clinic));
    }

    @Transactional
    public ClinicResponse update(Long id, ClinicRequest request) {
        Clinic clinic = clinicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Clinic", id));
        if (!clinic.getName().equals(request.getName()) && clinicRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("A clinic with name " + request.getName() + " already exists");
        }
        clinic.setName(request.getName());
        clinic.setAddress(request.getAddress());
        clinic.setPhone(request.getPhone());
        clinic.setEmail(request.getEmail());
        clinic.setLogoPath(request.getLogoPath());
        return ClinicResponse.fromEntity(clinicRepository.save(clinic));
    }

    @Transactional
    public void delete(Long id) {
        if (!clinicRepository.existsById(id)) {
            throw new ResourceNotFoundException("Clinic", id);
        }
        clinicRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<ClinicResponse> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return findAll();
        }
        return clinicRepository.findByNameContainingIgnoreCase(query.trim()).stream()
                .map(ClinicResponse::fromEntity)
                .toList();
    }
}
