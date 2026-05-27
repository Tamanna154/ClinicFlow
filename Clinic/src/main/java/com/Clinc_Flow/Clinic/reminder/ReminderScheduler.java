package com.Clinc_Flow.Clinic.reminder;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReminderScheduler {

    private final ReminderService reminderService;

    @Scheduled(fixedRate = 300000)
    public void processReminders() {
        log.info("ReminderScheduler: processing pending reminders");
        reminderService.processPendingReminders();
    }
}
