package com.Clinc_Flow.Clinic.medication;

import com.Clinc_Flow.Clinic.config.JwtUserDetails;
import com.Clinc_Flow.Clinic.user.User;
import com.Clinc_Flow.Clinic.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/patient-medications")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
public class PatientMedicationController {

    private final PatientMedicationRepository medicationRepository;
    private final PatientMealTimingsRepository mealTimingsRepository;
    private final UserRepository userRepository;

    private Long getPatientId() {
        JwtUserDetails userDetails = (JwtUserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        User u = userRepository.findById(userDetails.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (u.getPatientId() == null) {
            throw new IllegalArgumentException("Logged-in user is not associated with a patient profile");
        }
        return u.getPatientId();
    }

    @GetMapping("/timings")
    public ResponseEntity<PatientMealTimings> getMealTimings() {
        Long patientId = getPatientId();
        PatientMealTimings timings = mealTimingsRepository.findByPatientId(patientId)
                .orElseGet(() -> PatientMealTimings.builder()
                        .patientId(patientId)
                        .breakfastTime("08:00 AM")
                        .lunchTime("01:30 PM")
                        .dinnerTime("08:30 PM")
                        .build());
        return ResponseEntity.ok(timings);
    }

    @PostMapping("/timings")
    public ResponseEntity<PatientMealTimings> saveMealTimings(@RequestBody PatientMealTimings timingsRequest) {
        Long patientId = getPatientId();
        PatientMealTimings timings = mealTimingsRepository.findByPatientId(patientId)
                .orElseGet(() -> PatientMealTimings.builder().patientId(patientId).build());

        timings.setBreakfastTime(timingsRequest.getBreakfastTime());
        timings.setLunchTime(timingsRequest.getLunchTime());
        timings.setDinnerTime(timingsRequest.getDinnerTime());
        return ResponseEntity.ok(mealTimingsRepository.save(timings));
    }

    @GetMapping
    public ResponseEntity<List<PatientMedication>> getMedications() {
        Long patientId = getPatientId();
        return ResponseEntity.ok(medicationRepository.findByPatientId(patientId));
    }

    @PostMapping
    public ResponseEntity<PatientMedication> addMedication(@RequestBody PatientMedication request) {
        Long patientId = getPatientId();
        request.setPatientId(patientId);
        return ResponseEntity.status(HttpStatus.CREATED).body(medicationRepository.save(request));
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<?> confirmIntake(@PathVariable Long id) {
        PatientMedication medication = medicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Medication not found"));

        if (medication.getQuantity() > 0) {
            medication.setQuantity(medication.getQuantity() - 1);
        }
        medication.setLastTakenAt(java.time.OffsetDateTime.now());
        medicationRepository.save(medication);

        String warning = null;
        if (medication.getQuantity() < 3) {
            warning = "Refill reminder: You need to bring again / purchase " + medication.getMedicineName() 
                    + " soon. Only " + medication.getQuantity() + " tablets left.";
        }

        return ResponseEntity.ok(Map.of(
            "message", "Intake confirmed successfully",
            "newQuantity", medication.getQuantity(),
            "warning", warning != null ? warning : ""
        ));
    }

    @PostMapping("/{id}/add-stock")
    public ResponseEntity<PatientMedication> addStock(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        PatientMedication medication = medicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Medication not found"));

        int amountToAdd = body.getOrDefault("amount", 0);
        medication.setQuantity(medication.getQuantity() + amountToAdd);
        return ResponseEntity.ok(medicationRepository.save(medication));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedication(@PathVariable Long id) {
        medicationRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
