package com.Clinc_Flow.Clinic.notification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class TwilioNotificationService implements NotificationService {

    @Override
    public void sendSms(String to, String message) {
        log.info("SENDING SMS to {}: {}", to, message);
    }

    @Override
    public void sendWhatsApp(String to, String message) {
        log.info("SENDING WHATSAPP to {}: {}", to, message);
    }
}
