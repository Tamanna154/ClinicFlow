package com.Clinc_Flow.Clinic.doctor.letterhead;

import com.Clinc_Flow.Clinic.doctor.letterhead.dto.LetterheadRequest;
import com.Clinc_Flow.Clinic.doctor.letterhead.dto.LetterheadResponse;
import com.Clinc_Flow.Clinic.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LetterheadService {

    private final LetterheadRepository letterheadRepository;

    private static final String UPLOAD_DIR = "uploads/letterheads";

    @Transactional(readOnly = true)
    public LetterheadResponse getLetterhead(Long doctorId, HttpServletRequest request) {
        Letterhead lh = letterheadRepository.findByDoctorId(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Letterhead", doctorId));
        return LetterheadResponse.fromEntity(lh, getBaseUrl(request));
    }

    @Transactional
    public LetterheadResponse saveLetterhead(Long doctorId, LetterheadRequest req, HttpServletRequest request) {
        Letterhead lh = letterheadRepository.findByDoctorId(doctorId).orElse(null);
        if (lh == null) {
            lh = Letterhead.builder()
                    .doctorId(doctorId)
                    .useSystemGenerated(false)
                    .isActive(true)
                    .build();
        }
        lh.setClinicName(req.getClinicName());
        lh.setClinicAddress(req.getClinicAddress());
        lh.setClinicPhone(req.getClinicPhone());
        lh.setClinicEmail(req.getClinicEmail());
        lh.setGstNumber(req.getGstNumber());
        lh.setRegistrationNumber(req.getRegistrationNumber());
        if (req.getUseSystemGenerated() != null) {
            lh.setUseSystemGenerated(req.getUseSystemGenerated());
        }
        if (req.getTemplateStyle() != null) {
            lh.setTemplateStyle(req.getTemplateStyle());
        }
        lh = letterheadRepository.save(lh);
        return LetterheadResponse.fromEntity(lh, getBaseUrl(request));
    }

    @Transactional
    public LetterheadResponse uploadImage(Long doctorId, String field, MultipartFile file, HttpServletRequest request) {
        Letterhead lh = letterheadRepository.findByDoctorId(doctorId).orElse(null);
        if (lh == null) {
            lh = Letterhead.builder()
                    .doctorId(doctorId)
                    .useSystemGenerated(false)
                    .isActive(true)
                    .build();
        }

        try {
            String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            switch (field) {
                case "logo" -> lh.setClinicLogoPath(filename);
                case "design" -> lh.setLetterheadDesignPath(filename);
                case "signature" -> lh.setSignaturePath(filename);
                default -> throw new IllegalArgumentException("Unknown field: " + field);
            }
            lh = letterheadRepository.save(lh);
            return LetterheadResponse.fromEntity(lh, getBaseUrl(request));
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file", e);
        }
    }

    private String getBaseUrl(HttpServletRequest request) {
        return request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort();
    }
}
