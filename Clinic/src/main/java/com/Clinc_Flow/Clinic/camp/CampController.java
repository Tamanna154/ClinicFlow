package com.Clinc_Flow.Clinic.camp;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/camps")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
public class CampController {

    private final MedicalCampRepository campRepository;

    @GetMapping
    public ResponseEntity<List<MedicalCamp>> getCamps() {
        return ResponseEntity.ok(campRepository.findAllByOrderByCampDateAsc());
    }

    @PostMapping
    public ResponseEntity<MedicalCamp> createCamp(@RequestBody MedicalCamp camp) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(campRepository.save(camp));
    }
}
