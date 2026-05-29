package com.Clinc_Flow.Clinic.reminder;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/reminders")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
public class ReminderController {

    private final ReminderService reminderService;

    @PostMapping("/appointment/{appointmentId}")
    public ResponseEntity<?> createReminder(
            @PathVariable Long appointmentId,
            @RequestParam(defaultValue = "24") int hoursBefore) {
        Reminder reminder = reminderService.createFromAppointment(appointmentId, hoursBefore);
        return ResponseEntity.ok(reminder);
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<List<Reminder>> getReminders(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(reminderService.findByAppointment(appointmentId));
    }
}
