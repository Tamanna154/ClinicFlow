package com.Clinc_Flow.Clinic.sms;

import com.Clinc_Flow.Clinic.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/sms")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
@Slf4j
public class SmsController {

    private final NotificationService notificationService;

    @PostMapping("/bulk")
    public ResponseEntity<?> sendBulkSms(@RequestBody BulkSmsRequest request) {
        if (request.getPhoneNumbers() == null || request.getPhoneNumbers().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No phone numbers provided"));
        }
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message cannot be empty"));
        }
        List<Map<String, Object>> results = new ArrayList<>();
        for (String phone : request.getPhoneNumbers()) {
            try {
                notificationService.sendSms(phone, request.getMessage());
                results.add(Map.of("phone", phone, "status", "SENT"));
            } catch (Exception e) {
                log.warn("SMS failed for {}: {}", phone, e.getMessage());
                results.add(Map.of("phone", phone, "status", "FAILED", "error", e.getMessage()));
            }
        }
        long sent = results.stream().filter(r -> "SENT".equals(r.get("status"))).count();
        return ResponseEntity.ok(Map.of(
            "total", results.size(),
            "sent", sent,
            "failed", results.size() - sent,
            "results", results
        ));
    }

    @PostMapping("/whatsapp")
    public ResponseEntity<?> sendBulkWhatsApp(@RequestBody BulkSmsRequest request) {
        if (request.getPhoneNumbers() == null || request.getPhoneNumbers().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No phone numbers provided"));
        }
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message cannot be empty"));
        }
        List<Map<String, Object>> results = new ArrayList<>();
        for (String phone : request.getPhoneNumbers()) {
            try {
                notificationService.sendWhatsApp(phone, request.getMessage());
                results.add(Map.of("phone", phone, "status", "SENT"));
            } catch (Exception e) {
                log.warn("WhatsApp failed for {}: {}", phone, e.getMessage());
                results.add(Map.of("phone", phone, "status", "FAILED", "error", e.getMessage()));
            }
        }
        long sent = results.stream().filter(r -> "SENT".equals(r.get("status"))).count();
        return ResponseEntity.ok(Map.of(
            "total", results.size(),
            "sent", sent,
            "failed", results.size() - sent,
            "results", results
        ));
    }
}
