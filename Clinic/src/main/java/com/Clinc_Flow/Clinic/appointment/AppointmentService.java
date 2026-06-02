package com.Clinc_Flow.Clinic.appointment;

import com.Clinc_Flow.Clinic.appointment.dto.*;
import com.Clinc_Flow.Clinic.appointment.google.GoogleCalendarService;
import com.Clinc_Flow.Clinic.doctor.Doctor;
import com.Clinc_Flow.Clinic.doctor.DoctorRepository;
import com.Clinc_Flow.Clinic.doctor.availability.DoctorAvailability;
import com.Clinc_Flow.Clinic.doctor.availability.DoctorAvailabilityRepository;
import com.Clinc_Flow.Clinic.exception.ResourceNotFoundException;
import com.Clinc_Flow.Clinic.patient.Patient;
import com.Clinc_Flow.Clinic.patient.PatientRepository;
import com.Clinc_Flow.Clinic.patient.PatientVisitService;
import com.Clinc_Flow.Clinic.patient.dto.PatientVisitRequest;
import com.Clinc_Flow.Clinic.reminder.ReminderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final DoctorAvailabilityRepository availabilityRepository;
    private final GoogleCalendarService googleCalendarService;
    private final PatientVisitService patientVisitService;
    private final ReminderService reminderService;

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

        boolean isEmergency = "EMERGENCY".equalsIgnoreCase(request.getAppointmentType());

        if (!isEmergency) {
            String dayOfWeek = request.getAppointmentDate().getDayOfWeek().name();
            Optional<DoctorAvailability> avail = availabilityRepository
                    .findByDoctorIdAndDayOfWeek(request.getDoctorId(), dayOfWeek);

            boolean inAvailability = avail
                    .filter(DoctorAvailability::getIsAvailable)
                    .filter(a -> !request.getStartTime().isBefore(a.getStartTime())
                              && !request.getEndTime().isAfter(a.getEndTime()))
                    .isPresent();

            if (!inAvailability) {
                StringBuilder msg = new StringBuilder("Requested time is outside the doctor's availability");
                avail.filter(DoctorAvailability::getIsAvailable).ifPresent(a ->
                        msg.append(" (available: ").append(a.getStartTime()).append("-").append(a.getEndTime()).append(")"));
                throw new IllegalArgumentException(msg.toString());
            }
        }

        List<Appointment> conflicts = appointmentRepository
                .findByDoctorIdAndAppointmentDateAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
                        request.getDoctorId(), request.getAppointmentDate(),
                        request.getEndTime(), request.getStartTime());
        if (!conflicts.isEmpty()) {
            List<String> suggestions = findAlternativeSlots(
                    request.getDoctorId(), request.getAppointmentDate(),
                    request.getStartTime(), request.getEndTime());
            String msg = "Time slot overlaps with an existing appointment";
            if (!suggestions.isEmpty()) {
                msg += ". Available alternatives: " + String.join(", ", suggestions);
            }
            throw new IllegalArgumentException(msg);
        }

        Boolean isOnline = request.getIsOnline() != null && request.getIsOnline();
        String apptType = request.getAppointmentType();
        if (apptType == null) {
            apptType = isOnline ? "ONLINE" : "IN_PERSON";
        }
        Appointment appointment = Appointment.builder()
                .doctor(doctor)
                .patient(patient)
                .appointmentDate(request.getAppointmentDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(request.getStatus() != null ? request.getStatus() : "SCHEDULED")
                .reason(request.getReason())
                .notes(request.getNotes())
                .appointmentType(apptType)
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

        String validStatuses = "SCHEDULED,CONFIRMED,PATIENT_ARRIVED,IN_PROGRESS,CONSULTATION_COMPLETED,COMPLETED,CANCELLED,NO_SHOW";
        if (!validStatuses.contains(status.toUpperCase())) {
            throw new IllegalArgumentException("Invalid status. Must be one of: " + validStatuses);
        }

        String oldStatus = appointment.getStatus();
        appointment.setStatus(status.toUpperCase());
        appointment = appointmentRepository.save(appointment);

        if (status.equalsIgnoreCase("CONFIRMED") && !oldStatus.equalsIgnoreCase("CONFIRMED")) {
            try {
                reminderService.createFromAppointment(appointment.getId(), 24);
                reminderService.createFromAppointment(appointment.getId(), 2);
            } catch (Exception e) {
                log.warn("Failed to create reminders for appointment {}: {}", appointment.getId(), e.getMessage());
            }
        }

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
        if (request.getAppointmentType() != null) appointment.setAppointmentType(request.getAppointmentType());
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
        appointment = appointmentRepository.save(appointment);

        try {
            PatientVisitRequest visitRequest = PatientVisitRequest.builder()
                    .patientId(patient.getId())
                    .diagnosis(notes.getDiagnosis())
                    .prescription(notes.getPrescription())
                    .additionalNotes(notes.getAdditionalNotes())
                    .build();
            patientVisitService.createVisit(visitRequest, appointment.getDoctor().getId(), appointment.getId());
        } catch (Exception e) {
            log.warn("Failed to create patient visit record: {}", e.getMessage());
        }

        return AppointmentResponse.fromEntity(appointment);
    }

    private List<String> findAlternativeSlots(Long doctorId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        String dayOfWeek = date.getDayOfWeek().name();
        Optional<DoctorAvailability> avail = availabilityRepository
                .findByDoctorIdAndDayOfWeek(doctorId, dayOfWeek);

        List<String> alternatives = new ArrayList<>();
        if (avail.isEmpty() || !avail.get().getIsAvailable()) return alternatives;

        DoctorAvailability a = avail.get();
        List<Appointment> bookings = appointmentRepository
                .findByDoctorIdAndAppointmentDateOrderByStartTime(doctorId, date);

        int duration = a.getSlotDuration() != null ? a.getSlotDuration() : 30;
        LocalTime cursor = a.getStartTime();
        while (cursor.plusMinutes(duration).isBefore(a.getEndTime())
                || cursor.plusMinutes(duration).equals(a.getEndTime())) {
            LocalTime slotEnd = cursor.plusMinutes(duration);
            final LocalTime ss = cursor;
            final LocalTime se = slotEnd;

            boolean conflicts = bookings.stream().anyMatch(b ->
                    !b.getStartTime().isAfter(ss) && !b.getEndTime().isBefore(se) ||
                    (b.getStartTime().isBefore(se) && b.getEndTime().isAfter(ss)));

            if (!conflicts) {
                alternatives.add(ss.toString() + "-" + se.toString());
            }
            cursor = slotEnd;
        }
        return alternatives;
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
