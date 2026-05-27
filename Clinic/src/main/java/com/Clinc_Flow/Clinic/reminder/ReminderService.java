package com.Clinc_Flow.Clinic.reminder;

import com.Clinc_Flow.Clinic.appointment.Appointment;
import com.Clinc_Flow.Clinic.appointment.AppointmentRepository;
import com.Clinc_Flow.Clinic.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final AppointmentRepository appointmentRepository;

    @Transactional
    public Reminder createFromAppointment(Long appointmentId, int hoursBefore) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", appointmentId));
        LocalDateTime aptTime = LocalDateTime.of(appointment.getAppointmentDate(), appointment.getStartTime());
        LocalDateTime remindAt = aptTime.minusHours(hoursBefore);

        Reminder reminder = Reminder.builder()
                .appointmentId(appointmentId)
                .patientId(appointment.getPatient().getId())
                .patientName(appointment.getPatient().getName())
                .patientPhone(appointment.getPatient().getPhone())
                .doctorName(appointment.getDoctor().getName())
                .appointmentDateTime(aptTime)
                .reminderTime(remindAt)
                .message(String.format("Reminder: Your appointment with Dr. %s is on %s at %s",
                        appointment.getDoctor().getName(),
                        appointment.getAppointmentDate(),
                        appointment.getStartTime()))
                .sent(false)
                .sendSms(true)
                .build();
        return reminderRepository.save(reminder);
    }

    @Transactional(readOnly = true)
    public List<Reminder> findByAppointment(Long appointmentId) {
        return reminderRepository.findByAppointmentId(appointmentId);
    }

    @Transactional
    public void processPendingReminders() {
        List<Reminder> pending = reminderRepository
                .findBySentFalseAndReminderTimeBefore(LocalDateTime.now());
        for (Reminder r : pending) {
            try {
                if (r.getSendSms()) {
                    log.info("SENDING SMS to {}: {}", r.getPatientPhone(), r.getMessage());
                }
                r.setSent(true);
                reminderRepository.save(r);
            } catch (Exception e) {
                log.error("Failed to send reminder {}: {}", r.getId(), e.getMessage());
            }
        }
    }
}
