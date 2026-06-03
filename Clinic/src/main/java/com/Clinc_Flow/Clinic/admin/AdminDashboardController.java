package com.Clinc_Flow.Clinic.admin;

import com.Clinc_Flow.Clinic.admin.dto.AdminDashboardResponse;
import com.Clinc_Flow.Clinic.admin.dto.AdminRevenueTrendResponse;
import com.Clinc_Flow.Clinic.appointment.AppointmentRepository;
import com.Clinc_Flow.Clinic.appointment.dto.AppointmentResponse;
import com.Clinc_Flow.Clinic.patient.PatientRepository;
import com.Clinc_Flow.Clinic.patient.dto.PatientResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('CLINIC_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<AdminDashboardResponse> getDashboardStats() {
        return ResponseEntity.ok(adminDashboardService.getDashboardStats());
    }

    @GetMapping("/appointments/today")
    @PreAuthorize("hasAnyRole('CLINIC_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<AppointmentResponse>> getTodayAppointments() {
        List<AppointmentResponse> appointments = appointmentRepository
                .findByAppointmentDateOrderByStartTime(LocalDate.now())
                .stream()
                .map(AppointmentResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/patients/recent")
    @PreAuthorize("hasAnyRole('CLINIC_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<PatientResponse>> getRecentPatients(
            @RequestParam(defaultValue = "10") int limit) {
        List<PatientResponse> patients = patientRepository.findByArchivedFalse()
                .stream()
                .map(PatientResponse::fromEntity)
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(limit)
                .toList();
        return ResponseEntity.ok(patients);
    }

    @GetMapping("/revenue/trend")
    @PreAuthorize("hasAnyRole('CLINIC_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<AdminRevenueTrendResponse>> getRevenueTrend(
            @RequestParam(defaultValue = "6") int months) {
        return ResponseEntity.ok(adminDashboardService.getRevenueTrend(months));
    }
}
