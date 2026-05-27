package com.Clinc_Flow.Clinic.sms;

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
            log.info("SENDING SMS to {}: {}", phone, request.getMessage());
            Map<String, Object> entry = new HashMap<>();
            entry.put("phone", phone);
            entry.put("status", "SIMULATED_SENT");
            results.add(entry);
        }
        return ResponseEntity.ok(Map.of(
            "total", results.size(),
            "message", "SMS sent to " + results.size() + " numbers",
            "results", results
        ));
    }
}
