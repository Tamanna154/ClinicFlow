package com.Clinc_Flow.Clinic.appointment.google;

import com.Clinc_Flow.Clinic.appointment.Appointment;
import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.*;
import java.security.GeneralSecurityException;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;

@Service
@Slf4j
public class GoogleCalendarService {

    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final List<String> SCOPES = Collections.singletonList(
            "https://www.googleapis.com/auth/calendar.events"
    );
    private static final String TOKENS_DIRECTORY_PATH = "tokens";

    @Value("${google.calendar.credentials.file.path:}")
    private String credentialsFilePath;

    @Value("${google.calendar.application.name:ClinicFlow}")
    private String applicationName;

    private Calendar calendarService;
    private boolean enabled = false;

    @PostConstruct
    public void init() {
        if (credentialsFilePath == null || credentialsFilePath.trim().isEmpty()) {
            log.info("Google Calendar integration is disabled. Set 'google.calendar.credentials.file.path' to enable.");
            return;
        }

        try {
            final NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
            InputStream in = new FileInputStream(credentialsFilePath);
            GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(JSON_FACTORY, new InputStreamReader(in));

            GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                    httpTransport, JSON_FACTORY, clientSecrets, SCOPES)
                    .setDataStoreFactory(new FileDataStoreFactory(new java.io.File(TOKENS_DIRECTORY_PATH)))
                    .setAccessType("offline")
                    .build();

            LocalServerReceiver receiver = new LocalServerReceiver.Builder().setPort(8888).build();
            Credential credential = new AuthorizationCodeInstalledApp(flow, receiver).authorize("user");

            calendarService = new Calendar.Builder(httpTransport, JSON_FACTORY, credential)
                    .setApplicationName(applicationName)
                    .build();

            enabled = true;
            log.info("Google Calendar integration initialized successfully");
        } catch (IOException | GeneralSecurityException e) {
            log.warn("Failed to initialize Google Calendar service: {}", e.getMessage());
            log.info("Appointments will still work without Google Calendar sync");
        }
    }

    public String createCalendarEvent(Appointment appointment) {
        if (!enabled || calendarService == null) {
            log.info("[DRY-RUN] Would create Google Calendar event for appointment #{}: {} {} {}:00-{}:00",
                    appointment.getId(),
                    appointment.getDoctor().getName(),
                    appointment.getPatient().getName(),
                    appointment.getStartTime(),
                    appointment.getEndTime());
            return null;
        }

        try {
            Event event = new Event();
            event.setSummary("Appointment: " + appointment.getPatient().getName() + " with Dr. " + appointment.getDoctor().getName());
            event.setDescription(formatEventDescription(appointment));

            ZonedDateTime startZoned = ZonedDateTime.of(appointment.getAppointmentDate(), appointment.getStartTime(),
                    ZoneId.systemDefault());
            ZonedDateTime endZoned = ZonedDateTime.of(appointment.getAppointmentDate(), appointment.getEndTime(),
                    ZoneId.systemDefault());

            event.setStart(new EventDateTime()
                    .setDateTime(new com.google.api.client.util.DateTime(startZoned.toInstant().toEpochMilli()))
                    .setTimeZone(ZoneId.systemDefault().toString()));
            event.setEnd(new EventDateTime()
                    .setDateTime(new com.google.api.client.util.DateTime(endZoned.toInstant().toEpochMilli()))
                    .setTimeZone(ZoneId.systemDefault().toString()));

            Event createdEvent = calendarService.events().insert("primary", event).execute();
            log.info("Created Google Calendar event: {}", createdEvent.getId());
            return createdEvent.getId();
        } catch (IOException e) {
            log.error("Failed to create Google Calendar event: {}", e.getMessage());
            return null;
        }
    }

    public void updateCalendarEvent(Appointment appointment) {
        if (!enabled || calendarService == null || appointment.getGoogleEventId() == null) {
            return;
        }

        try {
            Event event = calendarService.events().get("primary", appointment.getGoogleEventId()).execute();
            event.setSummary("Appointment: " + appointment.getPatient().getName() + " with Dr. " + appointment.getDoctor().getName());
            event.setDescription(formatEventDescription(appointment));

            ZonedDateTime startZoned = ZonedDateTime.of(appointment.getAppointmentDate(), appointment.getStartTime(),
                    ZoneId.systemDefault());
            ZonedDateTime endZoned = ZonedDateTime.of(appointment.getAppointmentDate(), appointment.getEndTime(),
                    ZoneId.systemDefault());

            event.setStart(new EventDateTime()
                    .setDateTime(new com.google.api.client.util.DateTime(startZoned.toInstant().toEpochMilli()))
                    .setTimeZone(ZoneId.systemDefault().toString()));
            event.setEnd(new EventDateTime()
                    .setDateTime(new com.google.api.client.util.DateTime(endZoned.toInstant().toEpochMilli()))
                    .setTimeZone(ZoneId.systemDefault().toString()));

            calendarService.events().update("primary", appointment.getGoogleEventId(), event).execute();
            log.info("Updated Google Calendar event: {}", appointment.getGoogleEventId());
        } catch (IOException e) {
            log.error("Failed to update Google Calendar event: {}", e.getMessage());
        }
    }

    public void deleteCalendarEvent(String googleEventId) {
        if (!enabled || calendarService == null || googleEventId == null) {
            log.info("[DRY-RUN] Would delete Google Calendar event: {}", googleEventId);
            return;
        }

        try {
            calendarService.events().delete("primary", googleEventId).execute();
            log.info("Deleted Google Calendar event: {}", googleEventId);
        } catch (IOException e) {
            log.error("Failed to delete Google Calendar event: {}", e.getMessage());
        }
    }

    private String formatEventDescription(Appointment appointment) {
        return String.format("""
                Patient: %s
                Doctor: Dr. %s
                Date: %s
                Time: %s - %s
                Reason: %s
                Notes: %s
                """,
                appointment.getPatient().getName(),
                appointment.getDoctor().getName(),
                appointment.getAppointmentDate(),
                appointment.getStartTime(),
                appointment.getEndTime(),
                appointment.getReason() != null ? appointment.getReason() : "N/A",
                appointment.getNotes() != null ? appointment.getNotes() : "N/A"
        );
    }
}
