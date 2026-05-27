package com.Clinc_Flow.Clinic.appointment;

import com.Clinc_Flow.Clinic.appointment.dto.*;
import com.Clinc_Flow.Clinic.appointment.google.GoogleCalendarService;
import com.Clinc_Flow.Clinic.doctor.Doctor;
import com.Clinc_Flow.Clinic.doctor.DoctorRepository;
import com.Clinc_Flow.Clinic.exception.ResourceNotFoundException;
import com.Clinc_Flow.Clinic.patient.Patient;
import com.Clinc_Flow.Clinic.patient.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final GoogleCalendarService googleCalendarService;

    @Transactional(readOnly = true)
    public List<AppointmentResponse> findAll() {
        return appointmentRepository.findAll().stream()
                .map(AppointmentResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public AppointmentResponse findById(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        return AppointmentResponse.fromEntity(appointment);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> findByDoctor(Long doctorId) {
        return appointmentRepository.findByDoctorIdOrderByAppointmentDateDescStartTimeDesc(doctorId).stream()
                .map(AppointmentResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> findByPatient(Long patientId) {
        return appointmentRepository.findByPatientIdOrderByAppointmentDateDescStartTimeDesc(patientId).stream()
                .map(AppointmentResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> findByDate(LocalDate date) {
        return appointmentRepository.findByAppointmentDateOrderByStartTime(date).stream()
                .map(AppointmentResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> findByDoctorAndDate(Long doctorId, LocalDate date) {
        return appointmentRepository.findByDoctorIdAndAppointmentDateOrderByStartTime(doctorId, date).stream()
                .map(AppointmentResponse::fromEntity)
                .toList();
    }

    @Transactional
    public AppointmentResponse create(AppointmentRequest request) {
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", request.getDoctorId()));
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", request.getPatientId()));

        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time");
        }

        List<Appointment> conflicts = appointmentRepository
                .findByDoctorIdAndAppointmentDateAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
                        request.getDoctorId(), request.getAppointmentDate(),
                        request.getEndTime(), request.getStartTime());
        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException("Time slot overlaps with an existing appointment");
        }

        Boolean isOnline = request.getIsOnline() != null && request.getIsOnline();
        Appointment appointment = Appointment.builder()
                .doctor(doctor)
                .patient(patient)
                .appointmentDate(request.getAppointmentDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(request.getStatus() != null ? request.getStatus() : "SCHEDULED")
                .reason(request.getReason())
                .notes(request.getNotes())
                .isOnline(isOnline)
                .meetingLink(isOnline ? request.getMeetingLink() : null)
                .consultationNotes(request.getConsultationNotes())
                .build();

        appointment = appointmentRepository.save(appointment);

        if (Boolean.TRUE.equals(doctor.getGoogleCalendarEnabled())) {
            try {
                String eventId = googleCalendarService.createCalendarEvent(appointment);
                appointment.setGoogleEventId(eventId);
                appointment = appointmentRepository.save(appointment);
            } catch (Exception e) {
                log.warn("Failed to create Google Calendar event for appointment {}: {}", appointment.getId(), e.getMessage());
            }
        }

        return AppointmentResponse.fromEntity(appointment);
    }

    @Transactional
    public AppointmentResponse updateStatus(Long id, String status) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));

        String validStatuses = "SCHEDULED,CONFIRMED,IN_PROGRESS,COMPLETED,CANCELLED,NO_SHOW";
        if (!validStatuses.contains(status.toUpperCase())) {
            throw new IllegalArgumentException("Invalid status. Must be one of: " + validStatuses);
        }

        String oldStatus = appointment.getStatus();
        appointment.setStatus(status.toUpperCase());
        appointment = appointmentRepository.save(appointment);

        if (appointment.getGoogleEventId() != null && status.equalsIgnoreCase("CANCELLED")) {
            try {
                googleCalendarService.deleteCalendarEvent(appointment.getGoogleEventId());
                appointment.setGoogleEventId(null);
                appointment = appointmentRepository.save(appointment);
            } catch (Exception e) {
                log.warn("Failed to delete Google Calendar event: {}", e.getMessage());
            }
        }

        return AppointmentResponse.fromEntity(appointment);
    }

    @Transactional
    public AppointmentResponse update(Long id, AppointmentRequest request) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));

        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", request.getDoctorId()));
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", request.getPatientId()));

        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time");
        }

        List<Appointment> conflicts = appointmentRepository
                .findByDoctorIdAndAppointmentDateAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
                        request.getDoctorId(), request.getAppointmentDate(),
                        request.getEndTime(), request.getStartTime())
                .stream()
                .filter(a -> !a.getId().equals(id))
                .toList();
        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException("Time slot overlaps with an existing appointment");
        }

        appointment.setDoctor(doctor);
        appointment.setPatient(patient);
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setStartTime(request.getStartTime());
        appointment.setEndTime(request.getEndTime());
        if (request.getStatus() != null) appointment.setStatus(request.getStatus());
        appointment.setReason(request.getReason());
        appointment.setNotes(request.getNotes());
        Boolean isOnline = request.getIsOnline() != null && request.getIsOnline();
        appointment.setIsOnline(isOnline);
        appointment.setMeetingLink(isOnline ? request.getMeetingLink() : null);
        appointment.setConsultationNotes(request.getConsultationNotes());

        return AppointmentResponse.fromEntity(appointmentRepository.save(appointment));
    }

    @Transactional
    public AppointmentResponse addVisitNotes(Long id, com.Clinc_Flow.Clinic.appointment.dto.VisitNotesRequest notes) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        Patient patient = appointment.getPatient();

        StringBuilder sb = new StringBuilder();
        if (patient.getMedicalHistory() != null) {
            sb.append(patient.getMedicalHistory()).append("\n\n");
        }
        sb.append("--- Visit: ").append(java.time.LocalDate.now()).append(" ---\n");
        if (notes.getDiagnosis() != null && !notes.getDiagnosis().isEmpty()) {
            sb.append("Diagnosis: ").append(notes.getDiagnosis()).append("\n");
        }
        if (notes.getPrescription() != null && !notes.getPrescription().isEmpty()) {
            sb.append("Prescription: ").append(notes.getPrescription()).append("\n");
        }
        if (notes.getAdditionalNotes() != null && !notes.getAdditionalNotes().isEmpty()) {
            sb.append("Notes: ").append(notes.getAdditionalNotes()).append("\n");
        }
        patient.setMedicalHistory(sb.toString());
        patientRepository.save(patient);

        if (appointment.getNotes() != null) {
            appointment.setNotes(appointment.getNotes() + "\n\n[Visit Notes]\n" +
                (notes.getDiagnosis() != null ? "Diagnosis: " + notes.getDiagnosis() + "\n" : "") +
                (notes.getPrescription() != null ? "Prescription: " + notes.getPrescription() + "\n" : "") +
                (notes.getAdditionalNotes() != null ? "Notes: " + notes.getAdditionalNotes() : ""));
        } else {
            appointment.setNotes("[Visit Notes]\n" +
                (notes.getDiagnosis() != null ? "Diagnosis: " + notes.getDiagnosis() + "\n" : "") +
                (notes.getPrescription() != null ? "Prescription: " + notes.getPrescription() + "\n" : "") +
                (notes.getAdditionalNotes() != null ? "Notes: " + notes.getAdditionalNotes() : ""));
        }
        return AppointmentResponse.fromEntity(appointmentRepository.save(appointment));
    }

    @Transactional
    public void delete(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        if (appointment.getGoogleEventId() != null) {
            try {
                googleCalendarService.deleteCalendarEvent(appointment.getGoogleEventId());
            } catch (Exception e) {
                log.warn("Failed to delete Google Calendar event: {}", e.getMessage());
            }
        }
        appointmentRepository.deleteById(id);
    }
}
