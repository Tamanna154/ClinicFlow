package com.Clinc_Flow.Clinic.reminder;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReminderRepository extends JpaRepository<Reminder, Long> {
    List<Reminder> findByAppointmentId(Long appointmentId);
    List<Reminder> findByPatientIdOrderByReminderTimeDesc(Long patientId);
    List<Reminder> findBySentFalseAndReminderTimeBefore(java.time.LocalDateTime now);
}
